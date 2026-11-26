import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    // Optional to match createSignUpSchema in @/domain/auth.
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // scrypt hash from @/lib/password; excluded from queries unless selected.
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

export type User = mongoose.InferSchemaType<typeof userSchema>;
export type UserDocument = mongoose.HydratedDocument<User>;

// Reuse the registered model on hot reload / warm serverless invocations.
export const User =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", userSchema);
