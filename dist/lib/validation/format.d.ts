import { JsonError, SchemaNode } from "../types";
declare const formatValidators: Record<string, (node: SchemaNode, value: unknown) => undefined | JsonError | JsonError[]>;
export default formatValidators;
