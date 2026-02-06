"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
/**
 * Logger utility for application logging
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(logLevel = LogLevel.INFO) {
        this.logLevel = logLevel;
    }
    debug(message, ...args) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
    info(message, ...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }
    warn(message, ...args) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    error(message, error, ...args) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(`[ERROR] ${message}`, error, ...args);
        }
    }
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
}
exports.Logger = Logger;
exports.logger = new Logger(process.env.LOG_LEVEL || LogLevel.INFO);
//# sourceMappingURL=logger.js.map