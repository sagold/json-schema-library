module.exports = {
    config: {
        strings: require("./lib/config/strings")
    },
    cores: {
        Interface: require("./lib/cores/CoreInterface"),
        Draft04: require("./lib/cores/Draft04"), // core implementing draft04 specs
        JsonEditor: require("./lib/cores/JsonEditor") // adjusted core of draft04 to better support the json-editor
    },
    addSchema: require("./lib/addSchema"),
    createCustomError: require("./lib/utils/createCustomError"),
    addValidator: require("./lib/addValidator"), // add validation for keyword, format, datatype and customize errors
    createSchemaOf: require("./lib/createSchemaOf"), // creates a simple schema based on the given data
    each: require("./lib/each"), // iterate over data, receiving each data-entry with its schema
    getSchema: require("./lib/getSchema"), // get schema of data
    getChildSchemaSelection: require("./lib/getChildSchemaSelection"), // get available child schemas
    getTemplate: require("./lib/getTemplate"), // create data based which validates the given schema
    getTypeOf: require("./lib/getTypeOf"), // returns the javascript datatype
    isValid: require("./lib/isValid"), // returns a boolean if the schema is valid
    iterateSchema: require("./lib/iterateSchema"), // iterates over a json-schema
    SchemaService: require("./lib/SchemaService"),
    step: require("./lib/step"), // steps into a json-schema, returning the matching child-schema
    validate: require("./lib/validate"), // validates data by a schema
    validateAsync: require("./lib/validateAsync") // async validation of data by a schema
};
