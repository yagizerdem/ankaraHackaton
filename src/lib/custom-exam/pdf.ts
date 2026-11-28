import { EXAM_LANGUAGE_LABELS, QUESTION_TYPE_LABELS } from "@/domain/custom-exam";

import type { CustomExam, CustomExamQuestion } from "@/domain/custom-exam";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

// PDFs are printed on white paper, so they use fixed print colors rather than
// the screen theme's tokens.
const INK = "#131b2e";
const MUTED = "#45464f";
const RULE = "#c6c6d0";

function answerText(question: CustomExamQuestion) {
  if (question.type === "multiple_choice") {
    const option = question.options.find((item) => item.id === question.answer);
    return `${question.answer.toUpperCase()}) ${option?.text ?? ""}`;
  }
  if (question.type === "true_false") return question.answer === "true" ? "True" : "False";
  return question.answer;
}

function questionBlock(question: CustomExamQuestion, number: number, withAnswers: boolean): Content {
  const body: Content[] = [
    {
      text: [{ text: `${number}. `, bold: true }, question.prompt],
      style: "question",
    },
  ];

  if (question.type === "multiple_choice") {
    body.push({
      ul: question.options.map((option) => `${option.id.toUpperCase()})  ${option.text}`),
      type: "none",
      margin: [14, 4, 0, 0],
    });
  } else if (question.type === "true_false") {
    body.push({ text: "(   ) True        (   ) False", margin: [14, 4, 0, 0] });
  } else if (!withAnswers) {
    // Room to write the answer on the printed sheet.
    body.push({
      canvas: [0, 1, 2, 3].map((line) => ({
        type: "line" as const,
        x1: 14,
        y1: 22 + line * 22,
        x2: 515,
        y2: 22 + line * 22,
        lineWidth: 0.5,
        lineColor: RULE,
      })),
      margin: [0, 0, 0, 4],
    });
  }

  if (withAnswers) {
    body.push({
      stack: [
        { text: [{ text: "Answer: ", bold: true }, answerText(question)] },
        ...(question.explanation
          ? [{ text: [{ text: "Why: ", bold: true }, question.explanation], margin: [0, 2, 0, 0] } as Content]
          : []),
        ...(question.sourceExcerpt
          ? [{ text: `“${question.sourceExcerpt}”`, italics: true, color: MUTED, margin: [0, 2, 0, 0] } as Content]
          : []),
      ],
      style: "answer",
    });
  }

  return { stack: body, unbreakable: true, margin: [0, 0, 0, 14] };
}

/** The exam as a PDF, with or without the answer key, downloaded in the browser. */
export async function downloadExamPdf(exam: CustomExam, { withAnswers }: { withAnswers: boolean }) {
  // Loaded on demand: pdfmake and its fonts are large and only needed here.
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  const content: Content[] = [
    { text: exam.title, style: "title" },
    {
      text: [
        exam.documentName,
        `${exam.questions.length} questions`,
        exam.difficulty,
        EXAM_LANGUAGE_LABELS[exam.language],
      ].join("  ·  "),
      style: "meta",
    },
    ...(withAnswers ? [{ text: "Answer key", style: "badge" } as Content] : []),
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.75, lineColor: RULE }],
      margin: [0, 8, 0, 12],
    },
  ];

  // Number questions continuously, with one heading per type.
  let number = 0;
  for (const type of exam.types) {
    const questions = exam.questions.filter((question) => question.type === type);
    if (questions.length === 0) continue;
    content.push({ text: QUESTION_TYPE_LABELS[type], style: "section" });
    for (const question of questions) {
      number += 1;
      content.push(questionBlock(question, number, withAnswers));
    }
  }

  const definition: TDocumentDefinitions = {
    info: { title: exam.title },
    pageSize: "A4",
    pageMargins: [40, 48, 40, 48],
    content,
    footer: (page, pages) => ({
      text: `${page} / ${pages}`,
      alignment: "center",
      fontSize: 8,
      color: MUTED,
    }),
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.3, color: INK },
    styles: {
      title: { fontSize: 18, bold: true },
      meta: { fontSize: 9, color: MUTED, margin: [0, 4, 0, 0] },
      badge: { fontSize: 9, bold: true, color: MUTED, margin: [0, 6, 0, 0] },
      section: { fontSize: 12, bold: true, margin: [0, 4, 0, 8] },
      question: { margin: [0, 0, 0, 0] },
      answer: { fontSize: 9.5, margin: [14, 6, 0, 0] },
    },
  };

  const safeName = exam.title.replace(/[^\p{L}\p{N} _-]+/gu, "").trim() || "exam";
  pdfMake
    .createPdf(definition, undefined, undefined, vfs)
    .download(`${safeName}${withAnswers ? " - answer key" : ""}.pdf`);
}
