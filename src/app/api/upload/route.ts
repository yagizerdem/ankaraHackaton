import path from "node:path";
import dbConnect from "@/lib/db";
import { Document } from "@/models/document";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { verifySessionAndGetUser, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

// MongoDB caps a single document at 16MB; leave headroom for the other fields.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** multipart/form-data with the file under the `file` field. */
export const POST = withErrorHandler(async (request: Request) => {
  const user = await verifySessionAndGetUser(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );

  if (!user) {
    return Response.json(ApiResponse.unauthorized("Sign in required"), {
      status: HttpStatusCode.UNAUTHORIZED,
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      ApiResponse.badRequest("Expected multipart/form-data body"),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      ApiResponse.badRequest("Validation failed", {
        file: "`file` field is required",
      }),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }
  if (file.size === 0) {
    return Response.json(
      ApiResponse.badRequest("Validation failed", { file: "File is empty" }),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      ApiResponse.payloadTooLarge(
        `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      ),
      { status: HttpStatusCode.PAYLOAD_TOO_LARGE },
    );
  }

  const extension = path.extname(file.name).replace(/^\./, "");
  if (!extension) {
    return Response.json(
      ApiResponse.badRequest("Validation failed", {
        file: "File name must have an extension",
      }),
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  await dbConnect();
  const document = await Document.create({
    name: path.basename(file.name, path.extname(file.name)),
    extension,
    mimeType: file.type || "application/octet-stream",
    content: Buffer.from(await file.arrayBuffer()),
  });

  return Response.json(
    ApiResponse.created(
      {
        id: document._id,
        name: document.name,
        extension: document.extension,
        mimeType: document.mimeType,
        size: file.size,
        createdAt: document.createdAt,
      },
      "Document uploaded",
    ),
    { status: HttpStatusCode.CREATED },
  );
});
