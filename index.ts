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
export { createCustomError } from "./src/errors/createCustomError";
export { strings } from "./src/errors/strings";

// extra SchemaNode methods
export type { EachCallback } from "./src/methods/each";
export type { EachSchemaCallback } from "./src/methods/eachSchema";
export { addError } from "./src/addError";
export { addKeywords } from "./src/addKeywords";
export { addFormatValidator } from "./src/addFormatValidator";
export { extendDraft } from "./src/extendDraft";
// export { mergeNode } from "./src/mergeNode"; -- not yet

// utilities
export { default as getTypeOf } from "./src/utils/getTypeOf";
export { isReduceable } from "./src/compileSchema";

// remotes
export { remotes } from "./remotes";

// types
export type {
    Context,
    Draft,
    DraftVersion,
    GetSchemaOptions,
    JsonError,
    JsonPointer,
    JsonSchema,
    SchemaNode
} from "./src/types";

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
