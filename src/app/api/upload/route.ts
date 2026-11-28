import path from "node:path";
import { cookies } from "next/headers";

import { AppError } from "@/error/app-error";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { getPageCount } from "@/lib/document/page-count";
import HttpStatusCode from "@/lib/http-status-code";
import { Document } from "@/models/document";

// MongoDB caps a single document at 16MB; leave headroom for the other fields.
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for uploaded files
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"]; // Allowed file extensions
const MAX_PAGES = 50;

/** A 400 with the message under the `file` field, for the upload form. */
function fileError(message: string) {
  return new AppError(
    "Validation failed",
    HttpStatusCode.BAD_REQUEST,
    true,
    { file: message },
  );
}

/** multipart/form-data with the file under the `file` field. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await verifySessionAndGetUser(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!user) {
    throw new AppError("Sign in required", HttpStatusCode.UNAUTHORIZED);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new AppError(
      "Expected multipart/form-data body",
      HttpStatusCode.BAD_REQUEST,
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) throw fileError("`file` field is required");
  if (file.size === 0) throw fileError("File is empty");

  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(
      `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      HttpStatusCode.PAYLOAD_TOO_LARGE,
    );
  }

  const extension = path.extname(file.name).replace(/^\./, "");
  if (!extension) throw fileError("File name must have an extension");

  if (!ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
    throw fileError(
      `File extension must be one of: ${ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }

  const exist = await Document.exists({
    name: path.basename(file.name, path.extname(file.name)),
  });
  if (exist) throw fileError("A document with this name already exists");

  const content = Buffer.from(await file.arrayBuffer());

  let pageCount: number | null;
  try {
    pageCount = await getPageCount(content, extension.toLowerCase());
  } catch {
    throw fileError("File is corrupted or not a valid document");
  }
  if (pageCount !== null && pageCount > MAX_PAGES) {
    throw fileError(
      `Document has ${pageCount} pages; the limit is ${MAX_PAGES}`,
    );
  }

  await dbConnect();
  const document = await Document.create({
    name: path.basename(file.name, path.extname(file.name)),
    extension,
    mimeType: file.type || "application/octet-stream",
    content,
    pageCount,
    userId: user._id,
  });

  return Response.json(
    ApiResponse.created(
      {
        id: document._id,
        name: document.name,
        extension: document.extension,
        mimeType: document.mimeType,
        size: file.size,
        pageCount,
        createdAt: document.createdAt,
      },
      "Document uploaded",
    ),
    { status: HttpStatusCode.CREATED },
  );
});
