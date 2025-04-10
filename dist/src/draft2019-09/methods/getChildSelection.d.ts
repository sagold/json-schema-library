import { JsonError, SchemaNode } from "../../types";
/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
export declare function getChildSelection(node: SchemaNode, property: string | number): SchemaNode[] | JsonError;
