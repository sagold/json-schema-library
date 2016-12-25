module.exports = {
    cores: {
        Interface: require("./cores/CoreInterface"),
        Draft04: require("./cores/draft04")
    },
    createSchemaOf: require("./createSchemaOf"),
    each: require("./each"),
    getSchema: require("./getSchema"),
    getTemplate: require("./getTemplate"),
    getTypeOf: require("./getTypeOf"),
    isValid: require("./isValid"),
    SchemaService: require("./SchemaService"),
    step: require("./step"),
    validate: require("./validate")
};
