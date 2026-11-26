import mongoose from "mongoose";
import { connection } from "next/server";
import dbConnect from "@/lib/db";
import { withErrorHandler } from "@/error/with-error-handler";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";

/** Liveness + MongoDB reachability, for uptime checks and load balancers. */
export const GET = withErrorHandler(async () => {
  // With cacheComponents on, a GET handler can be prerendered at build time;
  // a health check must run on every request.
  await connection();

  const startedAt = performance.now();
  try {
    await dbConnect();
    await mongoose.connection.db!.admin().ping();
  } catch (error) {
    console.error(error);
    return Response.json(
      ApiResponse.serviceUnavailable("Database unreachable"),
      { status: HttpStatusCode.SERVICE_UNAVAILABLE },
    );
  }

  return Response.json(
    ApiResponse.ok(
      {
        status: "ok",
        database: "up",
        databaseLatencyMs: Math.round(performance.now() - startedAt),
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
      "Healthy",
    ),
    { status: HttpStatusCode.OK, headers: { "Cache-Control": "no-store" } },
  );
});
