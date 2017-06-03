module.exports = {
    cores: {
        Interface: require("./cores/CoreInterface"),
        Draft04: require("./cores/Draft04"), // core implementing draft04 specs
        JsonEditor: require("./cores/JsonEditor") // adjusted core of draft04 to better support the json-editor
    },
    addValidator: require("./addValidator"), // add validation for keyword, format, datatype and customize errors
    createSchemaOf: require("./createSchemaOf"), // creates a simple schema based on the given data
    each: require("./each"), // iterate over data, receiving each data-entry with its schema
    getSchema: require("./getSchema"), // get schema of data
    getChildSchemaSelection: require("./getChildSchemaSelection"), // get available child schemas
    getTemplate: require("./getTemplate"), // create data based which validates the given schema
    getTypeOf: require("./getTypeOf"), // returns the javascript datatype
    isValid: require("./isValid"), // returns a boolean if the schema is valid
    iterateSchema: require("./iterateSchema"), // iterates over a json-schema
    SchemaService: require("./SchemaService"),
    step: require("./step"), // steps into a json-schema, returning the matching child-schema
    validate: require("./validate") // validates data by a schema
};
