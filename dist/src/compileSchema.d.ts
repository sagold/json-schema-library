import { CreateError } from "./errors/createCustomError";
import { TemplateOptions } from "./methods/getTemplate";
import { SchemaNode, JsonSchema, Draft } from "./types";
export type CompileOptions = {
    drafts: Draft[];
    remote: SchemaNode;
    formatAssertion: boolean | "meta-schema";
    errors: Record<string, CreateError>;
    templateDefaultOptions?: TemplateOptions;
};
/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export declare function compileSchema(schema: JsonSchema, options?: Partial<CompileOptions>): SchemaNode;
export declare function isReduceable(node: SchemaNode): boolean;
