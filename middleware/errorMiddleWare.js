const errorHandleMiddleware = (err, req, res, next) => {
  // Log the error for debugging
  console.error("Error:", {
    message: err.message,
    name: err.name,
    code: err.statusCode,
  });

  // Default to 500 if status code is not set
  const statusCode = err.statusCode || 500;

  // Set the response status
  res.status(statusCode);

  // Send error response
  return res.json({
    success: false,
    message: err.message || "Internal Server Error",
    status: statusCode,
  });
};

export default errorHandleMiddleware;
