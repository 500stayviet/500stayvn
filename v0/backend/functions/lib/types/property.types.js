"use strict";
/**
 * 부동산 관련 타입 정의
 * Property Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Direction = exports.FurnitureOption = exports.TransactionType = exports.PropertyType = void 0;
/**
 * 부동산 유형
 */
var PropertyType;
(function (PropertyType) {
    PropertyType["APARTMENT"] = "apartment";
    PropertyType["TOWNHOUSE"] = "townhouse";
    PropertyType["VILLA"] = "villa";
    PropertyType["SHOPHOUSE"] = "shophouse";
    PropertyType["LAND"] = "land";
    PropertyType["OFFICE"] = "office";
    PropertyType["WAREHOUSE"] = "warehouse";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
/**
 * 거래 유형
 */
var TransactionType;
(function (TransactionType) {
    TransactionType["RENT"] = "rent";
    TransactionType["SALE"] = "sale";
    TransactionType["BOTH"] = "both";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
/**
 * 가구 옵션 (Nội thất)
 */
var FurnitureOption;
(function (FurnitureOption) {
    FurnitureOption["FULLY_FURNISHED"] = "fully_furnished";
    FurnitureOption["PARTIALLY_FURNISHED"] = "partially_furnished";
    FurnitureOption["UNFURNISHED"] = "unfurnished";
})(FurnitureOption || (exports.FurnitureOption = FurnitureOption = {}));
/**
 * 방향 (Hướng)
 */
var Direction;
(function (Direction) {
    Direction["EAST"] = "east";
    Direction["WEST"] = "west";
    Direction["SOUTH"] = "south";
    Direction["NORTH"] = "north";
    Direction["SOUTHEAST"] = "southeast";
    Direction["SOUTHWEST"] = "southwest";
    Direction["NORTHEAST"] = "northeast";
    Direction["NORTHWEST"] = "northwest";
})(Direction || (exports.Direction = Direction = {}));
//# sourceMappingURL=property.types.js.map