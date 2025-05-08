export type ApiResponse<T> = {
    message: string;
    data: T;
  };
  
  export type ApiError = {
    error: Record<string, unknown>;
  };