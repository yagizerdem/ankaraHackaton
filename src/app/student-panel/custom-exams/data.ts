import { cookies } from "next/headers";
import { connection } from "next/server";
import type mongoose from "mongoose";

import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import { getCustomExam, listCustomExams } from "@/lib/custom-exam/service";
import dbConnect from "@/lib/db";
import { Document } from "@/models/document";
import { Embedding } from "@/models/embedding";

import type { CustomExam, CustomExamSummary } from "@/domain/custom-exam";

export interface ExamDocumentOption {
  id: string;
  name: string;
  chunkCount: number;
}

export interface CustomExamsHome {
  /** The user's documents; only ones with chunks can be used for an exam. */
  documents: ExamDocumentOption[];
  exams: CustomExamSummary[];
}

async function currentUser() {
  // Per-user data: render at request time.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await dbConnect();
  return verifySessionAndGetUser(token);
}

/** The documents to pick from and the saved exams, or null when signed out. */
export async function getCustomExamsHome(): Promise<CustomExamsHome | null> {
  const user = await currentUser();
  if (!user) return null;

  const [documents, exams] = await Promise.all([
    Document.find({ userId: user._id })
      .select("name")
      .sort({ createdAt: -1 })
      .lean(),
    listCustomExams(user._id),
  ]);

  const counts = await Embedding.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { documentId: { $in: documents.map((document) => document._id) } } },
    { $group: { _id: "$documentId", count: { $sum: 1 } } },
  ]);
  const chunksByDocument = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));

  return {
    documents: documents.map((document) => ({
      id: document._id.toString(),
      name: document.name,
      chunkCount: chunksByDocument.get(document._id.toString()) ?? 0,
    })),
    exams,
  };
}

/**
 * One of the user's exams. "signed-out" and null (not found) are kept apart
 * so the page can show the sign-in gate or a 404.
 */
export async function getCustomExamPage(id: string): Promise<CustomExam | "signed-out" | null> {
  const user = await currentUser();
  if (!user) return "signed-out";
  return getCustomExam(id, user._id);
}
