import { createError, createCustomError } from "./lib/utils/createCustomError";
import getTypeOf from "./lib/getTypeOf";
import { resolveOneOf, resolveOneOfFuzzy } from "./lib/features/oneOf";
import { resolveAllOf } from "./lib/features/allOf";
import resolveRef from "./lib/resolveRef.strict";
import resolveRefMerge from "./lib/resolveRef.merge";
import settings from "./lib/config/settings";
import validateAsync from "./lib/validateAsync";
import { reduceSchema } from "./lib/reduceSchema";
import { resolveDynamicSchema, isDynamicSchema } from "./lib/resolveDynamicSchema";
import { mergeSchema } from "./lib/mergeSchema";
import render from "./lib/utils/render";
import { Draft } from "./lib/draft";
import { Draft04, draft04Config } from "./lib/draft04";
import { Draft06, draft06Config } from "./lib/draft06";
import { Draft07, draft07Config } from "./lib/draft07";
import { JsonEditor, draftJsonEditorConfig } from "./lib/jsoneditor";
import { isJsonError } from "./lib/types";
declare const config: {
    strings: Record<string, string>;
};
export { config, createCustomError, createError, Draft, Draft04, // core implementing draft04 specs
draft04Config, // config implementing draft04 specs
Draft06, // core implementing draft06 specs
draft06Config, // config implementing draft06 specs
Draft07, // core implementing draft07 specs
draft07Config, // config implementing draft07 specs
draftJsonEditorConfig, // adjusted config of draft04 to better support the json-editor
getTypeOf, // returns the javascript datatype
isDynamicSchema, // NEW
isJsonError, JsonEditor, // adjusted core of draft07 to better support the json-editor
mergeSchema, // NEW
reduceSchema, // NEW
render, resolveAllOf, resolveDynamicSchema, // NEW
resolveOneOf, resolveOneOfFuzzy, resolveRef, resolveRefMerge, settings, validateAsync };
import { DraftConfig } from "./lib/draft";
import { EachCallback } from "./lib/each";
import { EachSchemaCallback } from "./lib/eachSchema";
import { CreateError } from "./lib/utils/createCustomError";
import { GetSchemaOptions } from "./lib/getSchema";
import { JsonSchema, JsonPointer, JsonError, JsonValidator, JsonTypeValidator, ErrorData } from "./lib/types";
import { JSType } from "./lib/getTypeOf";
export type { CreateError, DraftConfig, EachCallback, EachSchemaCallback, ErrorData, GetSchemaOptions, JsonError, JsonPointer, JsonSchema, JsonTypeValidator, JsonValidator, JSType };
