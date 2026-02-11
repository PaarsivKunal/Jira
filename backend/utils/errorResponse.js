/**
 * Standardized error response utility
 * Ensures consistent error format across all endpoints
 */

/**
 * Create a standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} requestId - Request ID for tracking
 * @param {Object} details - Additional error details (only in development)
 */
export const sendErrorResponse = (res, statusCode, message, requestId = null, details = null) => {
  const response = {
    success: false,
    message,
  };

  if (requestId) {
    response.requestId = requestId;
  }

  if (process.env.NODE_ENV === 'development' && details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {*} data - Response data
 * @param {string} message - Success message
 */
export const sendSuccessResponse = (res, statusCode, data, message = null) => {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

