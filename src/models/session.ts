import mongoose from "mongoose";

export interface Session {
  userId: mongoose.Types.ObjectId;
  // SHA-256 of the cookie token; the raw token never touches the database.
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, trim: true },
    ip: { type: String, trim: true },
  },
  { timestamps: true },
);

// TTL index: MongoDB deletes the session once expiresAt passes. The sweep runs
// about once a minute, so lookups must still check expiresAt themselves.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Reuse the registered model on hot reload / warm serverless invocations.
export const Session =
  (mongoose.models.Session as mongoose.Model<Session>) ||
  mongoose.model<Session>("Session", sessionSchema);
