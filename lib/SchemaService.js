const getSchema = require("./getSchema");


class SchemaService {

    constructor(schema) {
        this.schema = schema;
    }

    get(pointer, data) {
        return getSchema(this.schema, pointer, data);
    }
}


module.exports = SchemaService;
