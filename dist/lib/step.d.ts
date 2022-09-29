import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft as Core } from "./draft";
/**
 * Returns the json-schema of the given object property or array item.
 * e.g. it steps by one key into the data
 *
 *  This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
 *  returns the correct schema.
 *
 * @param  core      - validator
 * @param  key       - property-name or array-index
 * @param  schema    - json schema of current data
 * @param  data      - parent of key
 * @param  [pointer] - pointer to schema and data (parent of key)
 * @return Schema or Error if failed resolving key
 */
export default function step(core: Core, key: string | number, schema: JSONSchema, data?: any, pointer?: JSONPointer): JSONSchema | JSONError;
