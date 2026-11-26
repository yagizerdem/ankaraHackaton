import path from "node:path";
import { connectDB } from "@/lib/db";
import { Document } from "@/models/document";

// MongoDB caps a single document at 16MB; leave headroom for the other fields.
const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** multipart/form-data with the file under the `file` field. */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data body" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json(
      { error: "`file` field is required" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return Response.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
      { status: 413 },
    );
  }

  const extension = path.extname(file.name).replace(/^\./, "");
  if (!extension) {
    return Response.json(
      { error: "File name must have an extension" },
      { status: 400 },
    );
  }

  await connectDB();
  const document = await Document.create({
    name: path.basename(file.name, path.extname(file.name)),
    extension,
    mimeType: file.type || "application/octet-stream",
    content: Buffer.from(await file.arrayBuffer()),
  });

  return Response.json(
    {
      id: document._id,
      name: document.name,
      extension: document.extension,
      mimeType: document.mimeType,
      size: file.size,
      createdAt: document.createdAt,
    },
    { status: 201 },
  );
}
