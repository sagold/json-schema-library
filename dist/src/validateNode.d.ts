import { SchemaNode } from "./types";
import { ValidationPath, ValidationResult } from "./Keyword";
export declare function validateNode(node: SchemaNode, data: unknown, pointer: string, path?: ValidationPath): ValidationResult[];
