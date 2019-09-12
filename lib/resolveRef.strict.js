const gp = require("gson-pointer");
const getTargetSchema = require("./utils/getTargetSchema");
const ref = require("./utils/ref");
// const isId = /^#[^\/]+/;
const hasId = /#[^\/]+/;
const iterateSchema = require("./iterateSchema");


function getRefMap(schema) {
    const map = {};
    iterateSchema(schema, (schema, pointer) => {
        if (schema.id) {
            map[schema.id] = { pointer, schema };
        }
    });
    return map;
}


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        return {};
    }

    if (schema.$ref == null) {
        return schema;
    }

    if (hasId.test(schema.$ref)) {
        const map = getRefMap(rootSchema);
        if (map[schema.$ref]) {
            return map[schema.$ref].schema;
        }

        const idOnly = `#${schema.$ref.split("#").pop()}`;
        if (map[idOnly]) {
            return map[idOnly].schema;
        }

        console.log(`Error: Failed resolving reference ${schema.$ref}.`);
        return {};
    }

    const target = ref.getPointer(schema.$ref);
    const targetSchema = getTargetSchema(schema.$ref, rootSchema, rootSchema);
    let reference = gp.get(targetSchema, target);
    reference = resolveRef(reference, targetSchema); // resolve ref until completely resolved

    if (reference == null) {
        console.log(`Error: Failed resolving reference ${schema.$ref}.`);
    }

    const result = Object.assign({}, reference);
    return result;
};
