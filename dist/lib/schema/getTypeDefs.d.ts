import { JSONSchema, JSONPointer } from "../types";
/**
 * Returns a list of all (direct) type definitions from the given schema
 * @param schema
 * @return list of type definition, given as { pointer, def }
 */
export default function getTypeDefs(schema: JSONSchema): Array<{
    pointer: JSONPointer;
    def: any;
}>;
