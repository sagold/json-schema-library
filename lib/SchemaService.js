const getSchema = require("./getSchema");


class SchemaService {

    constructor(schema, data) {
        this.schema = schema;
        this.data = data;
    }

    updateData(data) {
        this.data = data;
    }

    updateSchema(schema) {
        this.schema = schema;
    }

    get(pointer, data) {
        return getSchema(this.schema, pointer, data || this.data);
    }
}


module.exports = SchemaService;
