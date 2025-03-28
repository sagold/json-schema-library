import { CreateError } from "./errors/createCustomError";
import { TemplateOptions } from "./getTemplate";
import { SchemaNode, Context, DraftList, JsonSchema } from "./types";
export type CompileOptions = {
    drafts: DraftList;
    errors: Record<string, CreateError>;
    remoteContext?: Context;
    templateDefaultOptions?: TemplateOptions;
};
/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export declare function compileSchema(schema: JsonSchema, options?: Partial<CompileOptions>): SchemaNode;
export declare function isReduceable(node: SchemaNode): boolean;
