export interface FromErrors {
  [key: string]: string;
}

export class AppError extends Error {
  public httpStatusCode: number;
  public isOperational: boolean;
  public fromErrors?: FromErrors;

  constructor(
    message: string,
    httpStatusCode: number,
    isOperational = true,
    fromErrors?: FromErrors,
  ) {
    super(message);
    this.httpStatusCode = httpStatusCode;
    this.isOperational = isOperational;
    this.fromErrors = fromErrors;
  }
}
