"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorHandler_1 = require("../utils/errorHandler");
/**
 * Error handling middleware
 */
const errorMiddleware = (error, req, res, next) => {
    const errorResponse = errorHandler_1.ErrorHandler.handle(error);
    res.status(errorResponse.statusCode).json({
        error: {
            message: errorResponse.message,
            code: errorResponse.code,
        },
    });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=errorMiddleware.js.map