const getSchema = require("./getSchema");
const Core = require("./cores/JsonEditor");
const gp = require("gson-pointer");
const getParentPointer = require("gson-pointer/lib/common").getParentPointer;
const getLastProperty = require("gson-pointer/lib/common").getLastProperty;


function copy(value) {
    return JSON.parse(JSON.stringify(value));
}


class SchemaService {

    constructor(schema, data) {
        this.core = new Core(schema);
        this.schema = schema;
        this.data = data;
        this.cache = {};
    }

    updateData(data) {
        this.data = data;
        this.cache = {};
    }

    updateSchema(schema) {
        this.schema = schema;
        this.core.rootSchema = schema;
        this.cache = {};
    }

    get(pointer, data) {
        if (data) { // possibly separate entry point
            const schema = getSchema(this.core, this.schema, data, pointer);
            return copy(schema);
        }

        if (pointer === "#") { // root
            return this.schema;
        }

        if (this.cache[pointer]) { // return cached result
            return this.cache[pointer];
        }

        const parentPointer = getParentPointer(pointer);
        if (this.cache[parentPointer] == null) {
            // store parent (major performance improvement if its within oneof)
            const parentSchema = getSchema(this.core, this.schema, this.data, parentPointer);
            this.cache[parentPointer] = copy(parentSchema);
        }

        // step from parent to child
        const key = getLastProperty(pointer);
        const schema = getSchema(this.core, this.cache[parentPointer], gp.get(this.data, parentPointer), key);
        this.cache[pointer] = copy(schema);
        return this.cache[pointer];
    }
}


module.exports = SchemaService;
