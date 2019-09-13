const eachTypeDef = require("./eachTypeDef");
const remotes = require("../remotes");
const getTypeOf = require("./getTypeOf");
const copy = require("./utils/copy");
const gp = require("gson-pointer");
const isAbsoluteUrl = /^(https?|file):\/\//;
const isPointer = /^#\/\w+/;


function getAbsoluteRef($ref, currentLocation = "#") {
    const pointer = getPointer($ref);
    const url = $ref.replace(/#.*$/, "");
    if (url === "" && $ref[0] === "#" && isAbsoluteUrl.test(currentLocation)) {
        return `${currentLocation}${$ref}`;
    }
    if (!url) {
        return $ref;
    }
    if (isAbsoluteUrl.test(url)) {
        return `${url}${pointer}`;
    }
    if (isAbsoluteUrl.test(currentLocation)) {
        return `${currentLocation.replace(/[^/]*$/, "")}${url}${pointer}`;
    }
    return $ref;
}

function getPointer($ref) {
    return $ref.includes("#") ? decodeURIComponent(`#${$ref.replace(/^.*#/, "")}`) : "";
}

function joinUrl(url, base = "") {
    if (/^#[^\/]+/.test(url)) {
        return url;
    }

    if (url == null) {
        return base;
    }
    if (isAbsoluteUrl.test(url)) {
        return url;
    }
    return `${base.replace(/\/[^/]*$/, "")}/${url.replace(/(^\/|\/$)/, "")}/`;
}


/**
 * Experimental precompilation of an input json-schema. It resolves scopes and remote relative $ref pointers, to prepare
 * for remote $ref resolution without requiring changes within api
 *
 * @param  {Core} core
 * @param  {Object} rootSchema
 * @return {Object} compiled copy of schema
 */
function precompileSchema(rootSchema) {
    if (rootSchema.__compiled) {
        return rootSchema;
    }
    rootSchema = copy(rootSchema);

    // helper: a list of baseUrls to be retrieved from the current path. This prevents mixing up current baseUrls
    const baseUrls = {};
    const refs = {};
    const scopes = copy(remotes);

    function resolveRef({ $ref }) {

        if (isPointer.test($ref)) {
            const result = gp.get(rootSchema, $ref);
            if (result == null) {
                console.log("xxx failed finding pointer ref", $ref);
            } else {
                console.log("___ ref target found", $ref);
            }
        }
    }

    eachTypeDef(rootSchema, (schema, pointer) => {
        pointer = `#${pointer}`.replace(/##+/, "#");

        // json-schema pointers may not exactly match the parent (properties the target property/end of pointer), thus
        // we have to check both values, e.g. for #/properties/list (parent) and #/items/items (previous)
        const previousPointer = pointer.replace(/\/[^/]+$/, "");
        const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
        const scope = baseUrls[previousPointer] || baseUrls[parentPointer];

        const thisScope = joinUrl(schema.id, scope);
        if (schema.id === undefined) {
            Object.defineProperty(schema, "id", { enumerable: false, value: thisScope });
        } else {
            schema.id = thisScope;
        }

        if (scope !== schema.id) {
            remotes[schema.id] = schema;
        }

        if (scopes[thisScope] == null) {
            scopes[schema.id] = pointer;
        }

        if (schema.$ref) {
            resolveRef(schema);

            refs[schema.$ref] = schema.$ref;
            schema.$ref = getAbsoluteRef(schema.$ref, schema.id);
            refs[schema.$ref] = schema.id;
        }

        baseUrls[pointer] = schema.id;
        Object.defineProperty(schema, "__compiled", { enumerable: false, value: true });
        if (schema.getRoot == null) {
            Object.defineProperty(schema, "getRoot", { enumerable: false, value: () => rootSchema });
        }
    });

    Object.defineProperty(rootSchema, "getRef", { enumerable: false, value: (schema) => {
        if (refs[schema.$ref]) {
            if (scopes[schema.$ref]) {
                console.log("found reference", schema.$ref);
            } else {
                console.log("has reference", schema.$ref);
            }
        } else {
            console.log("get reference", schema.$ref);
        }
    } });

    return rootSchema;
}


module.exports = precompileSchema;
