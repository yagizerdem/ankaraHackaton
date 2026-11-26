import { cookies } from "next/headers";
import { connection } from "next/server";

import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Document } from "@/models/document";
import { KnowledgeGraph, TopicEdge, TopicNode } from "@/models/knowledge-graph";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export interface GraphOption {
  id: string;
  documentName: string;
  extension: string;
  topicCount: number;
  linkCount: number;
  createdAt: Date;
}

export interface GraphTopic {
  id: string;
  label: string;
  description: string;
  summary: string;
  keywords: string[];
  learningObjectives: string[];
  misconceptions: string[];
  difficulty: Difficulty;
  estimatedStudyMinutes: number | null;
  sourcePages: number[];
  importance: number;
}

export interface GraphLink {
  id: string;
  /** Prerequisite topic id. */
  source: string;
  /** Topic id that builds on the source. */
  target: string;
}

export interface SelectedGraph {
  id: string;
  documentName: string;
  topics: GraphTopic[];
  links: GraphLink[];
}

export interface KnowledgeGraphsData {
  options: GraphOption[];
  /** Null when the user has no graphs yet. */
  selected: SelectedGraph | null;
}

/**
 * The signed-in user's knowledge graphs, with the requested one (or the newest)
 * loaded in full. Null when signed out.
 */
export async function getKnowledgeGraphs(
  requestedId: string | undefined,
): Promise<KnowledgeGraphsData | null> {
  // Per-user data: render at request time. The session check compares
  // expiresAt to `new Date()`, which cacheComponents rejects while prerendering.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  await dbConnect();
  const user = await verifySessionAndGetUser(token);
  if (!user) return null;

  // Graphs only point at documents, so ownership goes through Document.
  const documents = await Document.find({ userId: user._id })
    .select("name extension")
    .lean();
  const documentsById = new Map(
    documents.map((document) => [document._id.toString(), document]),
  );

  const graphs = await KnowledgeGraph.find({
    documentId: { $in: documents.map((document) => document._id) },
  })
    .sort({ createdAt: -1 })
    .select("documentId nodes edges createdAt")
    .lean();

  const options: GraphOption[] = graphs.map((graph) => {
    const document = documentsById.get(graph.documentId.toString());
    return {
      id: graph._id.toString(),
      documentName: document?.name ?? "Untitled document",
      extension: document?.extension ?? "",
      topicCount: graph.nodes.length,
      linkCount: graph.edges.length,
      createdAt: graph.createdAt,
    };
  });

  const selectedOption =
    options.find((option) => option.id === requestedId) ?? options[0];
  if (!selectedOption) return { options, selected: null };

  const [nodes, edges] = await Promise.all([
    TopicNode.find({ graphId: selectedOption.id }).lean(),
    TopicEdge.find({
      _id: {
        $in: graphs.find((graph) => graph._id.toString() === selectedOption.id)!
          .edges,
      },
    }).lean(),
  ]);

  return {
    options,
    selected: {
      id: selectedOption.id,
      documentName: selectedOption.documentName,
      topics: nodes.map((node) => ({
        id: node._id.toString(),
        label: node.label,
        description: node.description,
        summary: node.summary ?? "",
        keywords: node.keywords ?? [],
        learningObjectives: node.learningObjectives ?? [],
        misconceptions: node.misconceptions ?? [],
        difficulty: node.difficulty,
        estimatedStudyMinutes: node.estimatedStudyMinutes ?? null,
        sourcePages: node.sourcePages ?? [],
        importance: node.importance ?? 0.5,
      })),
      links: edges.map((edge) => ({
        id: edge._id.toString(),
        source: edge.source.toString(),
        target: edge.target.toString(),
      })),
    },
  };
}
