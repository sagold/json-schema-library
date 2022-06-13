import { JSONSchema } from "../types";
/**
 * @throws Error    on multiple matches (invalid schema)
 *
 * Returns the type id of a schema object
 * @param schema
 * @return type id, if found
 */
export default function getTypeId(schema: JSONSchema): string | string[] | undefined;
