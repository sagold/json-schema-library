// core
export { compileSchema } from "./src/compileSchema";
export type { CompileOptions } from "./src/compileSchema";
export { isJsonError, isSchemaNode } from "./src/types";

// drafts
export { draft04 } from "./src/draft04";
export { draft06 } from "./src/draft06";
export { draft07 } from "./src/draft07";
export { draft2019 } from "./src/draft2019";
export { draftEditor } from "./src/draftEditor";

// keywords
export { oneOfFuzzyKeyword, oneOfKeyword } from "./src/keywords/oneOf";

// errors
export { render } from "./src/errors/render";
export { dashCase } from "./src/utils/dashCase";

// extra SchemaNode methods
export type { DataNode } from "./src/methods/toDataNodes";
export type { EachSchemaCallback } from "./src/methods/eachSchema";
// export { mergeNode } from "./src/mergeNode"; -- not yet

// utilities
export { default as getTypeOf } from "./src/utils/getTypeOf";
export { isReduceable } from "./src/SchemaNode";
export { extendDraft, addKeywords } from "./src/Draft";

// remotes
export { remotes } from "./remotes";

// types
export type { JsonError, JsonPointer, JsonSchema } from "./src/types";
export type { Draft, DraftVersion } from "./src/Draft";
export type { Context, SchemaNode, GetSchemaOptions } from "./src/SchemaNode";

export type {
    Keyword,
    ValidationPath,
    JsonSchemaReducerParams,
    JsonSchemaReducer,
    JsonSchemaResolverParams,
    JsonSchemaResolver,
    JsonSchemaValidatorParams,
    JsonSchemaValidator,
    JsonSchemaDefaultDataResolverParams,
    JsonSchemaDefaultDataResolver
} from "./src/Keyword";

// import { createError, createCustomError } from "./lib/utils/createCustomError";
// import getTypeOf from "./lib/getTypeOf";
// import settings from "./lib/config/settings";
// import strings from "./lib/config/strings";
// import validateAsync from "./lib/validateAsync";
// import { mergeSchema } from "./lib/mergeSchema";
// import render from "./lib/utils/render";
// import { JsonEditor, draftJsonEditorConfig } from "./lib/jsoneditor";
// const config = { strings };

// export type {
//     CreateError,
//     DraftConfig,
//     EachCallback,
//     EachSchemaCallback,
//     ErrorData,
//     GetSchemaOptions,
//     JsonError,
//     JsonPointer,
//     JsonSchema,
//     JsonTypeValidator,
//     JsonValidator,
//     JSType,
//     SchemaNode
// };
