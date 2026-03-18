"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformCases = exports.TransformTarget = void 0;
var TransformTarget;
(function (TransformTarget) {
    TransformTarget["MODEL"] = "model";
    TransformTarget["COLUMN"] = "column";
})(TransformTarget || (exports.TransformTarget = TransformTarget = {}));
exports.TransformCases = new Set([
    'UPPER',
    'LOWER',
    'UNDERSCORE',
    'CAMEL',
    'PASCAL',
    'CONST'
]);
