const getSchema = require("./getSchema");
const Core = require("./cores/JsonEditor");

function copy(value) {
    return JSON.parse(JSON.stringify(value));
}


class SchemaService {

    constructor(schema, data) {
        this.core = new Core(schema);
        this.schema = schema;
        this.data = data;
    }

    updateData(data) {
        this.data = data;
    }

    updateSchema(schema) {
        this.schema = schema;
        this.core.rootSchema = schema;
    }

    get(pointer, data) {
        const schema = getSchema(this.core, this.schema, data || this.data, pointer);
        return copy(schema);
    }
}


module.exports = SchemaService;
