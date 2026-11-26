import { cookies } from "next/headers";

import { createEmbeddingSchema } from "@/domain/rag";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import {
  TEXT_EXTRACTABLE_EXTENSIONS,
  extractText,
} from "@/lib/document/extract-text";
import HttpStatusCode from "@/lib/http-status-code";
import { chunkText } from "@/lib/rag/chunker";
import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  EmbeddedChunk,
  embedChunks,
} from "@/lib/rag/embeddings";
import { zodErrorToFromErrors, getJsonBody } from "@/lib/utils";
import { Document } from "@/models/document";

import type { EmbeddingResponse } from "@/domain/rag";
import { Embedding } from "@/models/embedding";

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

  const body = await getJsonBody(request);

  const parsed = createEmbeddingSchema().safeParse(body);
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

  if (!TEXT_EXTRACTABLE_EXTENSIONS.includes(document.extension)) {
    return Response.json(
      ApiResponse.unsupportedMediaType(
        `Can't read text from .${document.extension} files; upload a PDF, DOCX or TXT`,
      ),
      { status: HttpStatusCode.UNSUPPORTED_MEDIA_TYPE },
    );
  }

  let text: string;
  try {
    text = await extractText(document.content, document.extension);
  } catch {
    return Response.json(
      ApiResponse.unprocessableEntity(
        "Couldn't read the document's text; the file may be corrupted",
      ),
      { status: HttpStatusCode.UNPROCESSABLE_ENTITY },
    );
  }

  const chunks = await chunkText(text);
  if (chunks.length === 0) {
    return Response.json(
      ApiResponse.unprocessableEntity(
        "The document has no extractable text; scanned PDFs need OCR first",
      ),
      { status: HttpStatusCode.UNPROCESSABLE_ENTITY },
    );
  }

  let embeddings: EmbeddedChunk[];
  try {
    embeddings = await embedChunks(chunks, {
      title: document.name,
      signal: request.signal,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      ApiResponse.failure(
        "The embedding service failed; try again",
        HttpStatusCode.BAD_GATEWAY,
      ),
      { status: HttpStatusCode.BAD_GATEWAY },
    );
  }

  await Embedding.insertMany(
    embeddings.map((chunk) => ({
      ...chunk,
      documentId,
      userId: user._id,
    })),
  );

  return Response.json(
    ApiResponse.ok<EmbeddingResponse>(
      {
        documentId,
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        chunkCount: chunks.length,
      },
      "Embeddings generated",
    ),
    { status: HttpStatusCode.OK },
  );
});
