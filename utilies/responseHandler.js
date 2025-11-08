/**
 * Response handler utility for standardizing API responses
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message
 * @param {Object|Array|null} data - Response data (optional)
 * @param {Object} pagination - Pagination details (optional)
 * @returns {Object} - Formatted response object
 */
const sendResponse = (res, statusCode, message, data = null, pagination = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

// Success response helper
const successResponse = (res, message = 'Operation successful', data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, message, data);
};

// Created response helper (201)
const createdResponse = (res, message = 'Resource created successfully', data = null) => {
  return sendResponse(res, 201, message, data);
};

// No content response (204)
const noContentResponse = (res, message = 'No content') => {
  return res.status(204).json({
    success: true,
    message,
  });
};
export {
  sendResponse,
  successResponse,
  createdResponse,
  noContentResponse,
};
