import { JSONSchema, JSONPointer } from "../types";
type TypeDef = {
    pointer: JSONPointer;
    def: unknown;
};
/**
 * Returns a list of all (direct) type definitions from the given schema
 * @param schema
 * @return list of type definition, given as { pointer, def }
 */
export default function getTypeDefs(schema: JSONSchema): TypeDef[];
export {};
