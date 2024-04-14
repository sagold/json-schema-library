/**
 * @draft 06, 2019-09
 */
import { JsonSchema } from "../types";
import { JsonValidator } from "../validation/type";
import { SchemaNode } from "../schemaNode";
/**
 * @todo add support for dependentRequired (draft 2019-09)
 * returns dependencies as an object json schema. does not merge with input
 * json schema. you probably will need to do so to correctly resolve
 * references.
 *
 * @returns merged json schema defined by dependencies or undefined
 */
export declare function resolveDependencies(node: SchemaNode, data: unknown): JsonSchema | undefined;
/**
 * @draft 2019-09
 */
export declare const validateDependentRequired: JsonValidator;
/**
 * @draft 2019-09
 */
export declare const validateDependentSchemas: JsonValidator;
/**
 * validate dependencies definition for given input data
 */
export declare const validateDependencies: JsonValidator;
