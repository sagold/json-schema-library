import { getTypeOf } from "./getTypeOf";

export function isEmpty(v: unknown): boolean {
	const type = getTypeOf(v);
	switch (type) {
		case "string":
		case "array":
			return (v as [])?.length === 0;
		case "null":
		case "undefined":
			return true;
		case "object":
			return Object.keys(v as object).length === 0;
		default:
			return false;
	}
}
