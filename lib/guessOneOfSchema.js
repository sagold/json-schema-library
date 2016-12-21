const resolveRef = require("./resolveRef");
const getTypeOf = require("./getTypeOf");
const isValid = require("./isValid");


function fuzzyObjectValue(one, data, step) {
    if (data == null) {
        return -1;
    }

    let value = 0;
    const keys = Object.keys(one.properties);
    for (var i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key] != null && isValid(data[key], one.properties[key], one.properties[key], step)) {
            value += 1;
        }
    }
    return value;
}


function guessOneOf(schema, data, rootSchema, step) {
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = resolveRef(schema.oneOf[i], rootSchema);
        const schemaOfItem = isValid(data, one, one, step);
        if (schemaOfItem) {
            return schemaOfItem;
        }
    }

    if (getTypeOf(data === "object")) {
        let schemaOfItem;
        let fuzzyGreatest = 0;
        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = resolveRef(schema.oneOf[i], rootSchema);
            const fuzzyValue = fuzzyObjectValue(one, data);
            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = schema.oneOf[i];
            }
        }
        return schemaOfItem;
    }

    return false;
}


module.exports = guessOneOf;
