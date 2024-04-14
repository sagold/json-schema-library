import { JsonError } from "../types";
import { SchemaNode } from "../schemaNode";
declare const formatValidators: Record<string, (node: SchemaNode, value: unknown) => undefined | JsonError | JsonError[]>;
export default formatValidators;
