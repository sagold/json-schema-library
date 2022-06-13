import { JSONSchema } from "../types";
/**
 * compiles the input root schema for $ref resolution and returns it again
 * @attention this modifies input schema but maintains object-structure
 *
 * for a compiled json-schema you can call getRef on any contained schema (location of type).
 * this resolves a $ref target to a valid schema (for a valid $ref)
 *
 * @param rootSchema root json-schema ($id, defs, ... ) to compile
 * @param [force] = false force compile json-schema
 * @return compiled json-schema
 */
export default function compile(rootSchema: JSONSchema, force?: boolean): JSONSchema;
