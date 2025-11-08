const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode; // Add this for compatibility
    return error;
};

export default createError;