import { SchemaNode } from "./types.js";
import { ValidationPath, ValidationResult } from "./Keyword.js";
export declare function validateNode(node: SchemaNode, data: unknown, pointer: string, path?: ValidationPath): ValidationResult[];
