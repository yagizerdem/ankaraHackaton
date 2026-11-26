import { GoogleGenAI, type Part } from "@google/genai";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import * as z from "zod";
import { createKnowledgeGraphRequestSchema } from "@/domain/dag";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { extractText } from "@/lib/document/extract-text";
import HttpStatusCode from "@/lib/http-status-code";
import { getJsonBody, zodErrorToFromErrors } from "@/lib/utils";
import { Document } from "@/models/document";
import { KnowledgeGraph, TopicEdge, TopicNode } from "@/models/knowledge-graph";

// Reading a whole document and inferring prerequisites can take a while.
export const maxDuration = 300;

const DAG_MODEL = "gemini-3.8-flash";

// What Gemini must return. Edges point at node keys because Gemini can't know
// the ObjectIds; they are swapped for real ids before saving.
const graphSchema = z.object({
  nodes: z
    .array(
      z.object({
        key: z
          .string()
          .min(1)
          .describe("Unique kebab-case id, e.g. one-sided-limits"),
        label: z.string().min(1).describe("Short topic name"),
        description: z
          .string()
          .min(1)
          .describe("What the topic covers, in 1-3 sentences"),
        summary: z.string().describe("One-sentence summary"),
        keywords: z.array(z.string()),
        learningObjectives: z
          .array(z.string())
          .describe("Measurable outcomes, e.g. 'Compute one-sided limits'"),
        misconceptions: z
          .array(z.string())
          .describe("Common mistakes students make on this topic"),
        difficulty: z.enum(["beginner", "intermediate", "advanced", "expert"]),
        estimatedStudyMinutes: z.number().int().min(1),
        sourcePages: z
          .array(z.number().int().min(1))
          .describe("1-based pages of the document that cover the topic"),
        importance: z
          .number()
          .min(0)
          .max(1)
          .describe("How central the topic is to the document, 0-1"),
      }),
    )
    .min(1),
  edges: z.array(
    z.object({
      source: z.string().describe("Key of the prerequisite topic"),
      target: z.string().describe("Key of the topic that builds on source"),
    }),
  ),
});

type GeneratedGraph = z.infer<typeof graphSchema>;

const PROMPT = `You are building a prerequisite knowledge graph for a course.
Extract the learnable topics in this document. Each topic must contain a
measurable learning objective: not as broad as a whole course, not as narrow
as a single sentence. Aim for 15-30 topics. Merge synonymous topics. Do not
invent topics or page references.

Create a prerequisite edge A -> B only when A helps establish the knowledge
required for B. Do not treat page order alone as prerequisite evidence.
The graph must be a DAG: no cycles and no self-loops. If evidence is
insufficient, omit the relationship. Return JSON matching the schema.`;

// Gemini reads these natively; other formats are sent as extracted text.
const NATIVE_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
};

let client: GoogleGenAI | undefined;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/** Returns why the graph isn't a valid DAG, or null when it is. */
function findDagError({ nodes, edges }: GeneratedGraph) {
  const keys = new Set<string>();
  for (const node of nodes) {
    if (keys.has(node.key)) return `Duplicate topic key "${node.key}"`;
    keys.add(node.key);
  }

  const outgoing = new Map<string, string[]>();
  const inDegree = new Map([...keys].map((key) => [key, 0]));
  for (const { source, target } of edges) {
    if (!keys.has(source) || !keys.has(target)) {
      return `Edge ${source} -> ${target} points at a missing topic`;
    }
    if (source === target) return `Topic "${source}" depends on itself`;
    outgoing.set(source, [...(outgoing.get(source) ?? []), target]);
    inDegree.set(target, inDegree.get(target)! + 1);
  }

  // Kahn's algorithm: a cycle leaves topics that never reach in-degree 0.
  const queue = [...keys].filter((key) => inDegree.get(key) === 0);
  let visited = 0;
  while (queue.length > 0) {
    const key = queue.shift()!;
    visited++;
    for (const next of outgoing.get(key) ?? []) {
      const degree = inDegree.get(next)! - 1;
      inDegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }
  return visited === keys.size ? null : "The prerequisite graph has a cycle";
}

async function documentPart(
  content: Uint8Array,
  extension: string,
): Promise<Part> {
  const mimeType = NATIVE_MIME_TYPES[extension];
  if (mimeType) {
    return {
      inlineData: { mimeType, data: Buffer.from(content).toString("base64") },
    };
  }
  return { text: await extractText(content, extension) };
}

async function generateGraph(part: Part, signal: AbortSignal) {
  const response = await getClient().models.generateContent({
    model: DAG_MODEL,
    contents: [{ role: "user", parts: [part, { text: PROMPT }] }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(graphSchema),
      abortSignal: signal,
    },
  });
  return graphSchema.safeParse(JSON.parse(response.text ?? "null"));
}

export const POST = withErrorHandler(async (request: Request) => {
  await dbConnect();

  const user = await verifySessionAndGetUser(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!user) {
    return Response.json(ApiResponse.unauthorized("Sign in required"), {
      status: HttpStatusCode.UNAUTHORIZED,
    });
  }

  const parsed = createKnowledgeGraphRequestSchema().safeParse(
    await getJsonBody(request),
  );

  if (!parsed.success) {
    return Response.json(
      ApiResponse.badRequest(
        "Validation failed",
        zodErrorToFromErrors(parsed.error),
      ),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }
  const { documentId } = parsed.data;

  // Scoped to the user, so another user's id reads as not found.
  const document = await Document.findOne({
    _id: documentId,
    userId: user._id,
  });
  if (!document) {
    return Response.json(ApiResponse.notFound("Document not found"), {
      status: HttpStatusCode.NOT_FOUND,
    });
  }

  let part: Part;
  try {
    part = await documentPart(document.content, document.extension);
  } catch {
    return Response.json(
      ApiResponse.unsupportedMediaType(
        `Can't read .${document.extension} files; upload a PDF, DOCX or TXT`,
      ),
      { status: HttpStatusCode.UNSUPPORTED_MEDIA_TYPE },
    );
  }

  let graph: GeneratedGraph;
  try {
    const result = await generateGraph(part, request.signal);
    if (!result.success) {
      console.error(result.error);
      return Response.json(
        ApiResponse.failure(
          "The model returned an invalid graph; try again",
          HttpStatusCode.BAD_GATEWAY,
        ),
        { status: HttpStatusCode.BAD_GATEWAY },
      );
    }
    graph = result.data;
  } catch (error) {
    console.error(error);
    return Response.json(
      ApiResponse.failure(
        "The graph service failed; try again",
        HttpStatusCode.BAD_GATEWAY,
      ),
      { status: HttpStatusCode.BAD_GATEWAY },
    );
  }

  const dagError = findDagError(graph);
  if (dagError) {
    return Response.json(
      ApiResponse.unprocessableEntity(
        `The generated graph is not a valid DAG: ${dagError}; try again`,
      ),
      { status: HttpStatusCode.UNPROCESSABLE_ENTITY },
    );
  }

  // Ids are assigned up front so edges and the graph can reference nodes
  // before anything is written.
  const graphId = new mongoose.Types.ObjectId();
  const nodeIds = new Map(
    graph.nodes.map((node) => [node.key, new mongoose.Types.ObjectId()]),
  );

  const nodes = graph.nodes.map(({ key, ...node }) => ({
    ...node,
    _id: nodeIds.get(key)!,
    graphId,
  }));
  const edges = graph.edges.map((edge) => ({
    _id: new mongoose.Types.ObjectId(),
    source: nodeIds.get(edge.source)!,
    target: nodeIds.get(edge.target)!,
  }));

  try {
    await TopicNode.insertMany(nodes);
    await TopicEdge.insertMany(edges);
    await KnowledgeGraph.create({
      _id: graphId,
      documentId: document._id,
      nodes: nodes.map((node) => node._id),
      edges: edges.map((edge) => edge._id),
    });
  } catch (error) {
    // No transaction on a standalone server, so undo the partial write.
    await Promise.allSettled([
      TopicNode.deleteMany({ graphId }),
      TopicEdge.deleteMany({ _id: { $in: edges.map((edge) => edge._id) } }),
    ]);
    throw error;
  }

  // Regenerating replaces the document's previous graph.
  const previous = await KnowledgeGraph.find({
    documentId: document._id,
    _id: { $ne: graphId },
  });
  if (previous.length > 0) {
    const previousIds = previous.map((old) => old._id);
    await TopicEdge.deleteMany({
      _id: { $in: previous.flatMap((old) => old.edges) },
    });
    await TopicNode.deleteMany({ graphId: { $in: previousIds } });
    await KnowledgeGraph.deleteMany({ _id: { $in: previousIds } });
  }

  return Response.json(
    ApiResponse.created(
      {
        graphId: graphId.toString(),
        documentId,
        model: DAG_MODEL,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
      "Knowledge graph generated",
    ),
    { status: HttpStatusCode.CREATED },
  );
});
