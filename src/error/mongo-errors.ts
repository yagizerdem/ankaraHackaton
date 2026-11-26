import mongoose from "mongoose";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";

// The driver throws subclasses named MongoServerError, MongoNetworkError, ...,
// so match on the class rather than on error.name.
export const isMongoError = (error: unknown): error is mongoose.mongo.MongoError =>
  error instanceof mongoose.mongo.MongoError;

/** @see https://www.mongodb.com/docs/manual/reference/error-codes/ */
export function handleMongoError(error: unknown): ApiResponse<undefined> {
  if (!isMongoError(error)) return ApiResponse.internalServerError();

  switch (error.code) {
    case 11000: // DuplicateKey
    case 11001: {
      // keyValue is only set on server errors, e.g. { email: "a@b.com" }.
      const keyValue = (error as mongoose.mongo.MongoServerError).keyValue ?? {};
      const fromErrors = Object.fromEntries(
        Object.keys(keyValue).map((field) => [field, `${field} already exists`]),
      );
      return ApiResponse.failure(
        "Duplicate value",
        HttpStatusCode.CONFLICT,
        fromErrors,
      );
    }

    case 121: // DocumentValidationFailure
      return ApiResponse.unprocessableEntity("Document failed validation");

    case 2: // BadValue
    case 9: // FailedToParse
    case 14: // TypeMismatch
      return ApiResponse.badRequest("Invalid query or value");

    case 66: // ImmutableField
      return ApiResponse.badRequest("Field cannot be modified");

    case 17280: // KeyTooLong
      return ApiResponse.badRequest("Indexed value is too long");

    case 10334: // BSONObjectTooLarge
      return ApiResponse.payloadTooLarge("Document exceeds the 16MB limit");

    case 50: // MaxTimeMSExpired
      return ApiResponse.failure(
        "Query timed out",
        HttpStatusCode.REQUEST_TIMEOUT,
      );

    default:
      return ApiResponse.internalServerError();
  }
}
