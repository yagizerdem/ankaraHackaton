import mongoose from "mongoose";

/**
 * A read-only link a student gives their teacher. Like sessions, only the
 * SHA-256 hash of the token is stored, so a database leak can't open reports.
 */
const shareLinkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    graphId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeGraph",
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Expired links are removed by MongoDB's TTL monitor.
shareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type ShareLink = mongoose.InferSchemaType<typeof shareLinkSchema>;
export type ShareLinkDocument = mongoose.HydratedDocument<ShareLink>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const ShareLink =
  (mongoose.models.ShareLink as mongoose.Model<ShareLink>) ||
  mongoose.model<ShareLink>("ShareLink", shareLinkSchema);
