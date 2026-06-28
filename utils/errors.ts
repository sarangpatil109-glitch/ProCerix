export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    console.error(`[AppError] ${error.message}`);
    return;
  }
  
  if (error instanceof Error) {
    console.error(`[Error] ${error.message}`);
    return;
  }
  
  console.error("[Unknown Error]", error);
}
