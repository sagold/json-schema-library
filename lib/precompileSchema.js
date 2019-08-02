const iterateSchema = require("./iterateSchema");
const remotes = require("../remotes");
const getTypeOf = require("./getTypeOf");

const isAbsoluteUrl = /^(https?|file):\/\//;


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
function precompileSchema(core, rootSchema) {
    if (rootSchema.__compiled) {
        return rootSchema;
    }
    rootSchema = JSON.parse(JSON.stringify(rootSchema));
    // a list of baseUrls to be retrieved from the current path. This prevents mixing up current baseUrls
    const baseUrls = {};

    iterateSchema(rootSchema, (schema, pointer) => {
        if (getTypeOf(schema) !== "object") {
            throw new Error(`Invalid json-schema at ${pointer}: ${JSON.stringify(schema, null, 2)}`);
        }

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

        if (schema.$ref) {
            schema.$ref = getAbsoluteRef(schema.$ref, schema.id);
        }

        baseUrls[pointer] = schema.id;
        Object.defineProperty(schema, "__compiled", { enumerable: false, value: true });
    });

    return rootSchema;
}


module.exports = precompileSchema;
