import { cookies } from "next/headers";
import { connection } from "next/server";
import type mongoose from "mongoose";

import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Document } from "@/models/document";
import { Embedding } from "@/models/embedding";
import { KnowledgeGraph } from "@/models/knowledge-graph";

export interface UploadRow {
  id: string;
  name: string;
  extension: string;
  /** Bytes of the stored file. */
  size: number;
  pageCount: number | null;
  createdAt: Date;
  chunkCount: number;
  /** Null until a knowledge graph has been generated. */
  graph: { topics: number; edges: number } | null;
}

export interface UploadsData {
  userName: string;
  rows: UploadRow[];
}

/**
 * The signed-in user's documents with their pipeline progress, or null when
 * signed out.
 */
export async function getUploads(): Promise<UploadsData | null> {
  // Per-user data: render at request time. The session check compares
  // expiresAt to `new Date()`, which cacheComponents rejects while prerendering.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  await dbConnect();
  const user = await verifySessionAndGetUser(token);
  if (!user) return null;

  // $binarySize reads the file size without sending the file itself.
  const documents = await Document.aggregate<{
    _id: mongoose.Types.ObjectId;
    name: string;
    extension: string;
    pageCount?: number | null;
    createdAt: Date;
    size: number;
  }>([
    { $match: { userId: user._id } },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        name: 1,
        extension: 1,
        pageCount: 1,
        createdAt: 1,
        size: { $binarySize: "$content" },
      },
    },
  ]);

  const ids = documents.map((document) => document._id);

  const [chunkCounts, graphs] = await Promise.all([
    Embedding.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { documentId: { $in: ids } } },
      { $group: { _id: "$documentId", count: { $sum: 1 } } },
    ]),
    KnowledgeGraph.find({ documentId: { $in: ids } })
      .select("documentId nodes edges")
      .lean(),
  ]);

  const chunksByDocument = new Map(
    chunkCounts.map((entry) => [entry._id.toString(), entry.count]),
  );
  const graphByDocument = new Map(
    graphs.map((graph) => [
      graph.documentId.toString(),
      { topics: graph.nodes.length, edges: graph.edges.length },
    ]),
  );

  return {
    userName: user.firstName || user.username,
    rows: documents.map((document) => {
      const id = document._id.toString();
      return {
        id,
        name: document.name,
        extension: document.extension,
        size: document.size,
        pageCount: document.pageCount ?? null,
        createdAt: document.createdAt,
        chunkCount: chunksByDocument.get(id) ?? 0,
        graph: graphByDocument.get(id) ?? null,
      };
    }),
  };
}
