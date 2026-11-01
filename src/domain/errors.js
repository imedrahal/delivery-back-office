export class ApiError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** Translation key suffix for any thrown value (unknown errors map to UNKNOWN). */
export const errorCode = (error) => (error instanceof ApiError ? error.code : 'UNKNOWN');
