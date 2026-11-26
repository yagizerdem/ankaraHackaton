export interface UploadDocumentResponse {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  /** null for formats without a page count (txt, doc). */
  pageCount: number | null;
  createdAt: Date;
}

export interface DeleteDocumentResponse {
  id: string;
  deletedChunks: number;
  deletedGraphs: number;
}
