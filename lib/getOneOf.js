const Ajv = require("ajv");
const resolve = require("./resolveRef");


function createValidator(schema) {
    const ajv = new Ajv({ useDefaults: true });
    ajv.addFormat("mediaImage");
    ajv.addFormat("mediaVideo");
    return ajv.compile(schema);
}


function match(schema, data) {
    if (schema.__validate == null) {
        Object.defineProperty(schema, "__validate", {
            value: createValidator(schema)
        });
    }
    return schema.__validate(data);
}


function resolveOneOf(schema, data, rootSchema = schema) {
    const list = schema.oneOf;
    for (let i = 0; i < list.length; i += 1) {
        // resolve a $ref on object
        const itemSchema = resolve(list[i], rootSchema);
        if (match(itemSchema, data)) {
            return itemSchema;
        }
    }
    // list.forEach((schema) => console.log(schema.__validate.errors));
    return false;
}


module.exports = resolveOneOf;
