import strings from "./lib/config/strings";
import Interface from "./lib/cores/CoreInterface";
import Draft04 from "./lib/cores/Draft04";
import Draft07 from "./lib/cores/Draft07";
import JsonEditor from "./lib/cores/JsonEditor";
import addSchema from "./lib/addSchema";
import addValidator from "./lib/addValidator";
import compileSchema from "./lib/compileSchema";
import createCustomError from "./lib/utils/createCustomError";
import createSchemaOf from "./lib/createSchemaOf";
import each from "./lib/each";
import eachSchema from "./lib/eachSchema";
import getChildSchemaSelection from "./lib/getChildSchemaSelection";
import getSchema from "./lib/getSchema";
import getTemplate from "./lib/getTemplate";
import getTypeOf from "./lib/getTypeOf";
import isValid from "./lib/isValid";
import SchemaService from "./lib/SchemaService";
import step from "./lib/step";
import validate from "./lib/validate";
import validateAsync from "./lib/validateAsync";
import settings from "./lib/config/settings";

const config = { strings };

export {
    config,
    Interface,
    Draft04, // core implementing draft04 specs
    Draft07, // core implementing draft07 specs
    JsonEditor, // adjusted core of draft04 to better support the json-editor
    addSchema, // add a schema to be references via $ref
    addValidator, // add validation for keyword, format, datatype and customize errors
    compileSchema,
    createCustomError,
    createSchemaOf, // creates a simple schema based on the given data
    each, // iterate over data, receiving each data-entry with its schema
    eachSchema, // iterates over a json-schemas type definitions
    getChildSchemaSelection, // get available child schemas
    getSchema, // get schema of datapointer
    getTemplate, // create data which is valid to the given schema
    getTypeOf, // returns the javascript datatype
    isValid, // returns a boolean if the schema is valid
    settings,
    SchemaService,
    step, // steps into a json-schema, returning the matching child-schema
    validate, // validates data by a schema
    validateAsync // async validation of data by a schema
};

export type { JSONSchema, JSONPointer, JSONError, JSONValidator } from "./lib/types";
