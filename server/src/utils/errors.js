export const createError = (statusCode, message, errors = []) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.errors = errors;
  return err;
};
