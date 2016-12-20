const getSchema = require("./getSchema");


function copy(value) {
    return JSON.parse(JSON.stringify(value));
}

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
        const schema = getSchema(this.schema, pointer, data || this.data);
        return copy(schema);
    }
}


module.exports = SchemaService;
