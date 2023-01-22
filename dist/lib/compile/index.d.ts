import { Draft } from "../draft";
import { JsonSchema } from "../types";
/**
 * compiles the input root schema for `$ref` resolution and returns it again
 * @attention this modifies input schema but maintains data-structure and thus returns
 * the same object with JSON.stringify
 *
 * for a compiled json-schema you can call getRef on any contained schema (location of type).
 * this resolves a $ref target to a valid schema (for a valid $ref)
 *
 * @param draft
 * @param schemaToCompile - json-schema to compile
 * @param [rootSchema] - compiled root json-schema to use for definitions resolution
 * @param [force] = false - force compile json-schema
 * @return compiled input json-schema
 */
export default function compileSchema(draft: Draft, schemaToCompile: JsonSchema, rootSchema?: JsonSchema, force?: boolean): JsonSchema;
