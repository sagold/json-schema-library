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

// errors
export { createCustomError } from "./src/errors/createCustomError";
export { strings } from "./src/errors/strings";

// extra SchemaNode methods
export { each } from "./src/each";
export type { EachCallback } from "./src/each";
export { eachSchema } from "./src/eachSchema";
export type { EachSchemaCallback } from "./src/eachSchema";
export { createSchema } from "./src/createSchema";
export { addError } from "./src/addError";
export { addFeatures } from "./src/addFeatures";
export { addFormatValidator } from "./src/addFormatValidator";
// export { mergeNode } from "./src/mergeNode"; -- not yet

// utilities
export { default as getTypeOf } from "./src/utils/getTypeOf";
export { isReduceable } from "./src/compileSchema";

// types
export type {
    Context,
    Draft,
    DraftVersion,
    Feature,
    GetSchemaOptions,
    ValidationPath,
    JsonError,
    JsonPointer,
    JsonSchema,
    JsonSchemaReducerParams,
    JsonSchemaReducer,
    JsonSchemaResolverParams,
    JsonSchemaResolver,
    JsonSchemaValidatorParams,
    JsonSchemaValidator,
    JsonSchemaDefaultDataResolverParams,
    JsonSchemaDefaultDataResolver,
    SchemaNode
} from "./src/types";

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
