const gp = require("gson-pointer");
const getTargetSchema = require("./utils/getTargetSchema");
const ref = require("./utils/ref");
// const isId = /^#[^\/]+/;
const hasId = /#[^\/]+/;
const eachTypeDef = require("./eachTypeDef");

function getRefMap(schema) {
    const map = {};
    eachTypeDef(schema, (schema, pointer) => {
        if (schema.id) {
            map[schema.id] = { pointer, schema };
        }
    });
    return map;
}


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null || schema.$ref == null) {
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

    // pointer of ref
    const target = ref.getPointer(schema.$ref);
    // change target schema if it is a remote
    const targetSchema = getTargetSchema(schema.$ref, rootSchema, rootSchema);
    // get pointer value
    let reference = gp.get(targetSchema, target);
    // and recursively resolve $ref
    reference = resolveRef(reference, targetSchema); // resolve ref until completely resolved

    if (reference == null) {
        console.log(`Error: Failed resolving reference ${schema.$ref}.`);
    }

    const result = Object.assign({}, reference);
    return result;
};
