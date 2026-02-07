"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHelper = void 0;
/**
 * Response helper utilities
 */
class ResponseHelper {
    /**
     * Send success response
     */
    static success(res, data, statusCode = 200) {
        const response = {
            success: true,
            data,
        };
        res.status(statusCode).json(response);
    }
    /**
     * Send error response
     */
    static error(res, message, code, statusCode = 500) {
        const response = {
            success: false,
            error: {
                message,
                code,
            },
        };
        res.status(statusCode).json(response);
    }
    /**
     * Send paginated response
     */
    static paginated(res, items, total, page, pageSize) {
        const response = {
            success: true,
            data: {
                items,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
        res.status(200).json(response);
    }
}
exports.ResponseHelper = ResponseHelper;
//# sourceMappingURL=responseHelper.js.map