import { unstable_rethrow } from "next/navigation";
import { AppError } from "@/error/app-error";
import { ApiResponse } from "@/lib/api-response";
import HttpStatusCode from "@/lib/http-status-code";
import { handleMongoError, isMongoError } from "./mongo-errors";

/**
 * Wraps an App Router route handler so uncaught errors become an ApiResponse
 * JSON body instead of Next's default 500 page.
 *
 * export const POST = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler<TReq extends Request, TCtx>(
  handler: (req: TReq, ctx: TCtx) => Response | Promise<Response>,
) {
  return async function (req: TReq, ctx: TCtx): Promise<Response> {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error(error);

      // Let Next's own control-flow errors (redirect, notFound, ...) through.
      unstable_rethrow(error);

      if (error instanceof AppError && error.isOperational) {
        const body = ApiResponse.from({
          httpStatusCode: error.httpStatusCode,
          message: error.message,
          fromErrors: error.fromErrors,
          isSuccess: false,
          error: error.message,
          data: undefined,
        });
        return Response.json(body, { status: error.httpStatusCode });
      }

      if (isMongoError(error)) {
        const body = handleMongoError(error);
        return Response.json(body, { status: body.httpStatusCode });
      }

      return Response.json(ApiResponse.internalServerError(), {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      });
    }
  };
}
