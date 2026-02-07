"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectHelper = void 0;
/**
 * Object helper functions
 */
class ObjectHelper {
    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    /**
     * Check if object is empty
     */
    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
    /**
     * Pick specific keys from object
     */
    static pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    }
    /**
     * Omit specific keys from object
     */
    static omit(obj, keys) {
        const result = Object.assign({}, obj);
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    }
    /**
     * Merge objects deeply
     */
    static deepMerge(target, ...sources) {
        if (!sources.length)
            return target;
        const source = sources.shift();
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key])
                        Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                }
                else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this.deepMerge(target, ...sources);
    }
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
}
exports.ObjectHelper = ObjectHelper;
//# sourceMappingURL=objectHelper.js.map