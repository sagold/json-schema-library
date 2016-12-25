const getSchema = require("./getSchema");
const Core = require("./cores/draft04");

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
        const schema = getSchema(this.core, this.schema, pointer, data || this.data);
        return copy(schema);
    }
}


module.exports = SchemaService;
