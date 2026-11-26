export interface FormErrors {
  [key: string]: string;
}

export class AppError extends Error {
  public httpStatusCode: number;
  public isOperational: boolean;
  public fromErrors?: FormErrors;

  constructor(
    message: string,
    httpStatusCode: number,
    isOperational = true,
    fromErrors?: FormErrors,
  ) {
    super(message);
    this.httpStatusCode = httpStatusCode;
    this.isOperational = isOperational;
    this.fromErrors = fromErrors;
  }
}
