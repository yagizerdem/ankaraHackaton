import { cookies } from "next/headers";

import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import HttpStatusCode from "@/lib/http-status-code";
import { Document } from "@/models/document";
import { Embedding } from "@/models/embedding";
import { KnowledgeGraph, TopicEdge, TopicNode } from "@/models/knowledge-graph";

import type { DeleteDocumentResponse } from "@/domain/document";

/** Deletes a document with everything built from it: chunks and graphs. */
export const DELETE = withErrorHandler(
  async (_request: Request, context: RouteContext<"/api/upload/[id]">) => {
    const { id } = await context.params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      throw new AppError("Validation failed", HttpStatusCode.BAD_REQUEST, true, {
        id: "id must be a valid document id",
      });
    }

    await dbConnect();

    const user = await verifySessionAndGetUser(
      (await cookies()).get(SESSION_COOKIE)?.value,
    );
    if (!user) {
      throw new AppError("Sign in required", HttpStatusCode.UNAUTHORIZED);
    }

    // Scoped to the user, so another user's id reads as not found.
    const document = await Document.findOne({ _id: id, userId: user._id })
      .select("_id")
      .lean();
    if (!document) {
      throw new AppError("Document not found", HttpStatusCode.NOT_FOUND);
    }

    const graphs = await KnowledgeGraph.find({ documentId: document._id })
      .select("_id edges")
      .lean();
    const graphIds = graphs.map((graph) => graph._id);

    // Derived data first, so a failure never leaves orphans behind a
    // document that is already gone.
    const [, , chunks] = await Promise.all([
      TopicEdge.deleteMany({ _id: { $in: graphs.flatMap((graph) => graph.edges) } }),
      TopicNode.deleteMany({ graphId: { $in: graphIds } }),
      Embedding.deleteMany({ documentId: document._id }),
    ]);
    await KnowledgeGraph.deleteMany({ _id: { $in: graphIds } });
    await Document.deleteOne({ _id: document._id });

    return Response.json(
      ApiResponse.ok<DeleteDocumentResponse>(
        {
          id,
          deletedChunks: chunks.deletedCount,
          deletedGraphs: graphIds.length,
        },
        "Document deleted",
      ),
      { status: HttpStatusCode.OK },
    );
  },
);
