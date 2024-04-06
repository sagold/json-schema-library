import { Draft } from "../../draft";
import { JsonSchema } from "../../types";
/**
 * @draft starting with _draft 2019-09_ plain name fragments are no longer
 * defined with $id, but instead with the new keyword $anchor
 * (which has a different syntax)
 * https://json-schema.org/draft/2019-09/release-notes#incompatible-changes
 *
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
export default function compileSchema(draft: Draft, schemaToCompile: JsonSchema, rootSchema?: JsonSchema, force?: boolean): JsonSchema;
