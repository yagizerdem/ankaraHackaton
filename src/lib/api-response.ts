import HttpStatusCode from "@/lib/http-status-code";

interface FromErrors {
  [key: string]: string;
}

export class ApiResponse<T> {
  public message: string;
  public fromErrors?: FromErrors;
  public httpStatusCode: HttpStatusCode;
  public isSuccess: boolean;
  public data?: T;
  public error?: string;

  constructor(
    message: string,
    httpStatusCode: HttpStatusCode,
    isSuccess: boolean,
  ) {
    this.message = message;
    this.httpStatusCode = httpStatusCode;
    this.isSuccess = isSuccess;
  }

  static from<T>({
    message,
    httpStatusCode,
    isSuccess,
    data,
    error,
    fromErrors,
  }: {
    message: string;
    httpStatusCode: HttpStatusCode;
    isSuccess: boolean;
    data?: T;
    error?: string;
    fromErrors?: FromErrors;
  }) {
    const response = new ApiResponse<T>(message, httpStatusCode, isSuccess);
    response.data = data;
    response.error = error;
    response.fromErrors = fromErrors;
    return response;
  }

  static ok<T>(data?: T, message = "OK") {
    const response = new ApiResponse<T>(message, HttpStatusCode.OK, true);
    response.data = data;
    return response;
  }

  static created<T>(data?: T, message = "Created") {
    const response = new ApiResponse<T>(message, HttpStatusCode.CREATED, true);
    response.data = data;
    return response;
  }

  static badRequest(message = "Bad request", fromErrors?: FromErrors) {
    return ApiResponse.failure(message, HttpStatusCode.BAD_REQUEST, fromErrors);
  }

  static unauthorized(message = "Unauthorized") {
    return ApiResponse.failure(message, HttpStatusCode.UNAUTHORIZED);
  }

  static forbidden(message = "Forbidden") {
    return ApiResponse.failure(message, HttpStatusCode.FORBIDDEN);
  }

  static notFound(message = "Not found") {
    return ApiResponse.failure(message, HttpStatusCode.NOT_FOUND);
  }

  static conflict(message = "Conflict") {
    return ApiResponse.failure(message, HttpStatusCode.CONFLICT);
  }

  static payloadTooLarge(message = "Payload too large") {
    return ApiResponse.failure(message, HttpStatusCode.PAYLOAD_TOO_LARGE);
  }

  static unsupportedMediaType(message = "Unsupported media type") {
    return ApiResponse.failure(message, HttpStatusCode.UNSUPPORTED_MEDIA_TYPE);
  }

  static unprocessableEntity(
    message = "Validation failed",
    fromErrors?: FromErrors,
  ) {
    return ApiResponse.failure(
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      fromErrors,
    );
  }

  static tooManyRequests(message = "Too many requests") {
    return ApiResponse.failure(message, HttpStatusCode.TOO_MANY_REQUESTS);
  }

  static internalServerError(message = "Internal server error") {
    return ApiResponse.failure(message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  static serviceUnavailable(message = "Service unavailable") {
    return ApiResponse.failure(message, HttpStatusCode.SERVICE_UNAVAILABLE);
  }

  /** Any other error status; the named factories above all delegate here. */
  static failure(
    message: string,
    httpStatusCode: HttpStatusCode,
    fromErrors?: FromErrors,
  ) {
    const response = new ApiResponse<never>(message, httpStatusCode, false);
    response.error = message;
    response.fromErrors = fromErrors;
    return response;
  }
}
