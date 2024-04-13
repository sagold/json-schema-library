import { createError, createCustomError } from "./lib/utils/createCustomError";
import getTypeOf from "./lib/getTypeOf";
import { resolveOneOf, resolveOneOfFuzzy } from "./lib/features/oneOf";
import { resolveAllOf } from "./lib/features/allOf";
import resolveRefStrict from "./lib/resolveRef.strict";
import resolveRef from "./lib/resolveRef";
import settings from "./lib/config/settings";
import strings from "./lib/config/strings";
import validateAsync from "./lib/validateAsync";
import { reduceSchema } from "./lib/reduceSchema";
import { resolveDynamicSchema, isDynamicSchema } from "./lib/resolveDynamicSchema";
import { mergeSchema } from "./lib/mergeSchema";
import render from "./lib/utils/render";
import { Draft } from "./lib/draft";
import { Draft04, draft04Config } from "./lib/draft04";
import { Draft06, draft06Config } from "./lib/draft06";
import { Draft07, draft07Config } from "./lib/draft07";
import { Draft2019, draft2019Config } from "./lib/draft2019";
import { JsonEditor, draftJsonEditorConfig } from "./lib/jsoneditor";
import { isJsonError } from "./lib/types";
import { SchemaNode, isSchemaNode, createNode } from "./lib/schemaNode";

const config = { strings };

export {
    config,
    createCustomError,
    createError,
    createNode, // v10
    Draft,
    Draft04, // core implementing draft04 specs
    draft04Config, // config implementing draft04 specs
    Draft06, // core implementing draft06 specs
    draft06Config, // config implementing draft06 specs
    Draft07, // core implementing draft07 specs
    draft07Config, // config implementing draft07 specs
    Draft2019, // core implementing draft2019-09 specs
    draft2019Config, // config implementing draft2019-09 specs
    draftJsonEditorConfig, // adjusted config of draft04 to better support the json-editor
    getTypeOf, // returns the javascript datatype
    isDynamicSchema, // v8
    isJsonError,
    isSchemaNode, // v10
    JsonEditor, // adjusted core of draft07 to better support the json-editor
    mergeSchema, // v8
    reduceSchema, // v8
    render,
    resolveAllOf,
    resolveDynamicSchema, // v8
    resolveOneOf,
    resolveOneOfFuzzy,
    resolveRefStrict,
    resolveRef,
    settings,
    validateAsync // async validation of data by a schema
};

import { DraftConfig } from "./lib/draft";
import { EachCallback } from "./lib/each";
import { EachSchemaCallback } from "./lib/eachSchema";
import { CreateError } from "./lib/utils/createCustomError";
import { GetSchemaOptions } from "./lib/getSchema";
import {
    JsonSchema,
    JsonPointer,
    JsonError,
    ErrorData,
} from "./lib/types";
import {
    JsonValidator,
    JsonTypeValidator
} from "./lib/validation/type";
import { JSType } from "./lib/getTypeOf";

export type {
    CreateError,
    DraftConfig,
    EachCallback,
    EachSchemaCallback,
    ErrorData,
    GetSchemaOptions,
    JsonError,
    JsonPointer,
    JsonSchema,
    JsonTypeValidator,
    JsonValidator,
    JSType,
    SchemaNode
};
