const getSchema = require("./getSchema");


class SchemaService {

    constructor(schema, data) {
        this.schema = schema;
        this.data = data;
    }

    get(pointer, data) {
        return getSchema(this.schema, pointer, data || this.data);
    }
}


module.exports = SchemaService;
