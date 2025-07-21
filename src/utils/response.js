// utils/response.js

/**
 * Send a success response with a consistent structure.
 *
 * @param {Object} res - Express response object.
 * @param {String} message - Message to be sent.
 * @param {Object} [data=null] - Additional data to include in the response.
 * @param {Number} [statusCode=200] - HTTP status code.
 */
const sendSuccessResponse = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data !== null && data !== undefined && { data }),
    });
};

/**
 * Send an error response with a consistent structure.
 *
 * @param {Object} res - Express response object.
 * @param {String} message - Error message to be sent.
 * @param {Object} [error=null] - Error details (if any).
 * @param {Number} [statusCode=400] - HTTP status code.
 */

const sendErrorResponse = (res, message, data = null, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(data !== null && data !== undefined && { data })
    });
};

module.exports = {
    sendSuccessResponse,
    sendErrorResponse,
};
