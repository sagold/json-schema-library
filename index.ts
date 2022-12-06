import { createError, createCustomError } from "./lib/utils/createCustomError";
import getTypeOf from "./lib/getTypeOf";
import resolveOneOf from "./lib/resolveOneOf.strict";
import resolveAllOf from "./lib/resolveAllOf";
import resolveOneOfFuzzy from "./lib/resolveOneOf.fuzzy";
import resolveRef from "./lib/resolveRef.strict";
import resolveRefMerge from "./lib/resolveRef.merge";
import SchemaService from "./lib/SchemaService";
import settings from "./lib/config/settings";
import strings from "./lib/config/strings";
import validateAsync from "./lib/validateAsync";
import render from "./lib/utils/render";
import { Draft } from "./lib/draft";
import { Draft04, draft04Config } from "./lib/draft04";
import { Draft06, draft06Config } from "./lib/draft06";
import { Draft07, draft07Config } from "./lib/draft07";
import { JsonEditor, draftJsonEditorConfig } from "./lib/jsoneditor";
import { isJSONError } from "./lib/types";

const config = { strings };

export {
    config,
    Draft,
    Draft04, // core implementing draft04 specs
    draft04Config, // config implementing draft04 specs
    Draft06, // core implementing draft06 specs
    draft06Config, // config implementing draft06 specs
    Draft07, // core implementing draft07 specs
    draft07Config, // config implementing draft07 specs
    JsonEditor, // adjusted core of draft04 to better support the json-editor
    draftJsonEditorConfig, // adjusted config of draft04 to better support the json-editor
    createError,
    createCustomError,
    getTypeOf, // returns the javascript datatype
    isJSONError,
    render,
    resolveAllOf,
    resolveRef,
    resolveRefMerge,
    resolveOneOf,
    resolveOneOfFuzzy,
    settings,
    SchemaService,
    validateAsync // async validation of data by a schema
};

import { DraftConfig } from "./lib/draft";
import { EachCallback } from "./lib/each";
import { EachSchemaCallback } from "./lib/eachSchema";
import { ErrorData, CreateError } from "./lib/utils/createCustomError";
import { JSONSchema, JSONPointer, JSONError, JSONValidator, JSONTypeValidator } from "./lib/types";
import { JSType } from "./lib/getTypeOf";

export type {
    CreateError,
    DraftConfig,
    EachCallback,
    EachSchemaCallback,
    ErrorData,
    JSONError,
    JSONPointer,
    JSONSchema,
    JSONTypeValidator,
    JSONValidator,
    JSType
};
