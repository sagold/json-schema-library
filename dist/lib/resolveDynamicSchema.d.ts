import { JsonError } from "./types";
import { SchemaNode } from "./schemaNode";
import { JsonData } from "@sagold/json-pointer";
export declare function isDynamicSchema(schema: JsonData): boolean;
/**
 * @note this utility does not reference draft methods for resolution
 * @todo consider using draft methods
 *
 * Resolves all dynamic schema definitions for the given input data and returns
 * the resulting json-schema without any dynamic schema definitions. The result
 * is not merged with the original input schema, thus static definitions of the
 * input schema are untouched and missing. For a full schema definition of this
 * input data you have to merge the result with the original schema
 * (@see reduceSchema)
 *
 * dynamic schema definitions: dependencies, allOf, anyOf, oneOf, if
 *
 * @returns static schema from resolved dynamic schema definitions for this
 *  specific input data
 */
export declare function resolveDynamicSchema(schemaNode: SchemaNode, data: unknown): SchemaNode | JsonError;
