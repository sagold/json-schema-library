const gp = require("gson-pointer");
const getTargetSchema = require("./utils/getTargetSchema");
const ref = require("./utils/ref");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        return {};
    }

    if (schema.$ref == null) {
        return schema;
    }

    const target = ref.getPointer(schema.$ref);
    const targetSchema = getTargetSchema(schema.$ref, rootSchema, rootSchema);
    let reference = gp.get(targetSchema, decodeURIComponent(target));
    reference = resolveRef(reference, targetSchema); // resolve ref until completely resolved

    if (reference == null) {
        console.log(`Error: Failed resolving reference ${schema.$ref}.`);
    }

    const result = Object.assign({}, reference);
    return result;
};
