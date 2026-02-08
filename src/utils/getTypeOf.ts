const toString = Object.prototype.toString;

export type JSType =
	| "array"
	| "bigint"
	| "boolean"
	| "function"
	| "null"
	| "number"
	| "object"
	| "string"
	| "symbol"
	| "undefined";

export function getTypeOf(value: unknown): JSType {
	const type = toString.call(value).slice(8, -1).toLowerCase();
	if (type === "file") {
		return "object";
	}
	return type as JSType;
}
