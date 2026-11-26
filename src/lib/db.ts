import mongoose from "mongoose";

// Cache the connection promise on globalThis so dev hot-reload and warm
// serverless invocations reuse one connection instead of opening a new one.
const globalForMongoose = globalThis as unknown as {
  mongooseConnection?: Promise<typeof mongoose>;
};

export function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  globalForMongoose.mongooseConnection ??= mongoose.connect(uri).catch((err) => {
    // Let the next call retry instead of caching a rejected promise forever.
    globalForMongoose.mongooseConnection = undefined;
    throw err;
  });
  return globalForMongoose.mongooseConnection;
}
