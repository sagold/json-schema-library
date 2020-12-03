import strings from "./lib/config/strings";
import Interface from "./lib/cores/CoreInterface";
import Draft04 from "./lib/cores/Draft04";
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
export default {
    config: {
        strings
    },
    cores: {
        Interface,
        Draft04,
        JsonEditor // adjusted core of draft04 to better support the json-editor
    },
    addSchema,
    addValidator,
    compileSchema,
    createCustomError,
    createSchemaOf,
    each,
    eachSchema,
    getChildSchemaSelection,
    getSchema,
    getTemplate,
    getTypeOf,
    isValid,
    SchemaService,
    step,
    validate,
    validateAsync // async validation of data by a schema
};
