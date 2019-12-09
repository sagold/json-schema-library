/* eslint quote-props: 0 */
const resolveOneOfFuzzy = require("./resolveOneOf.fuzzy");
const getTypeOf = require("./getTypeOf");
const merge = require("./utils/merge");
const copy = require("./utils/copy");
const settings = require("./config/settings");


let cache;

function shouldResolveRef(schema, pointer) {
    if (schema.$ref == null) {
        return true;
    }
    if (pointer == null) {
        throw new Error("Missing pointer");
    }

    const value = (cache[pointer] == null || cache[pointer][schema.$ref] == null) ? 0 : cache[pointer][schema.$ref];
    console.log("value", pointer, schema.$ref, value);
    return value < settings.GET_TEMPLATE_RECURSION_LIMIT;
}

/**
 * return the $ref target of the json-schema or the input-schema if no $ref is assigned.
 * Additionally counts numbers of $ref-resolutions to restrict iterations to the defined
 * value in settings.
 *
 * @param  {Core} core
 * @param  {JSONSchema} schema
 * @return {JSONSchema} resolved $ref target-schema, input-schema in case the iteration-limit is reached
 */
function resolveRef(core, schema, pointer) {
    if (schema.$ref == null) {
        return schema;
    }

    if (pointer == null) {
        throw new Error("missing pointer", pointer);
    }

    console.log("RESOLVE", pointer, schema.$ref, cache[pointer] && cache[pointer][schema.$ref]);

    cache[pointer] = cache[pointer] || {};
    cache[pointer][schema.$ref] = cache[pointer][schema.$ref] || 0;
    cache[pointer][schema.$ref] += 1;
    return core.resolveRef(schema);
}


function convertValue(type, value) {
    if (type === "string") {
        return JSON.stringify(value);
    } else if (typeof value !== "string") {
        return null;
    }
    try {
        value = JSON.parse(value);
        if (typeof value === type) {
            return value;
        }
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}


/**
 * Resolves allOf and anyOf schema-options, returning a combined json-schema
 *
 * @param  {Core} core
 * @param  {JSONSchema} schema
 * @return {JSONSchem} resolved json-schema or input-schema
 */
function createTemplateSchema(core, schema, data, pointer) {
    if (getTypeOf(schema) !== "object") {
        return schema;
    }

    if (schema.$ref) {
        if (shouldResolveRef(schema, pointer) === false && data == null) {
            return false;
        }
    }

    let templateSchema = copy(resolveRef(core, schema, pointer));
    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
        if (shouldResolveRef(schema.anyOf[0], `${pointer}/anyOf/0`)) {
            const resolvedAnyOf = resolveRef(core, schema.anyOf[0], `${pointer}/anyOf/0`);
            templateSchema = merge(templateSchema, resolvedAnyOf);
            templateSchema.pointer = schema.anyOf[0].$ref || templateSchema.pointer;
            delete templateSchema.anyOf;
        }
    }

    if (Array.isArray(schema.allOf)) {
        for (let i = 0, l = schema.allOf.length; i < l; i += 1) {
            if (shouldResolveRef(schema.allOf[i], `${pointer}/allOf/${i}`)) {
                templateSchema = merge(templateSchema, resolveRef(core, schema.allOf[i], `${pointer}/allOf/${i}`));
                templateSchema.pointer = schema.allOf[i].$ref || templateSchema.pointer;
            }
        }
        delete templateSchema.allOf;
    }

    templateSchema.pointer = templateSchema.pointer || schema.$ref;
    return templateSchema;
}


let count = 0;

/**
 * Create data object matching the given schema
 *
 * @param  {CoreInterface} core     - json schema core
 * @param  {Mixed} [data]           - optional template data
 * @param  {Object} [schema]        - json schema, defaults to rootSchema
 * @return {Mixed} created template data
 */
function getTemplate(core, data, schema, pointer) {
    // if (count++ > 200) return false;
    if (schema == null) {
        throw new Error("getTemplate: missing schema for data", data);
    }

    if (pointer == null) {
        throw new Error("Missing pointer");
    }

    // resolve $ref references, allOf and first anyOf definitions
    schema = createTemplateSchema(core, schema, data, pointer);
    if (schema === false) {
        return undefined;
    }
    pointer = schema.pointer || pointer;

    // console.log("getTemplate", pointer, data);
    if (schema.oneOf) {
        // find correct schema for data
        const resolvedSchema = resolveOneOfFuzzy(core, data, schema);
        if (data == null && resolvedSchema.type === "error") {
            schema = schema.oneOf[0];
        } else if (resolvedSchema.type === "error") {
            // @todo - check: do not return schema, but either input-data or undefined (clearing wrong data)
            return data;
        } else {
            schema = resolvedSchema;
        }
    }

    if (schema.type == null) {
        console.warn(`Invalid json-schema: missing property 'type' for ${data && JSON.stringify(data)}`);
        return undefined;
    }

    // reset invalid type
    if (data != null && getTypeOf(data) !== schema.type) {
        data = convertValue(schema.type, data);
    }

    if (TYPE[schema.type] == null) { // eslint-disable-line no-use-before-define
        throw new Error(`Unsupported type '${schema.type} in ${JSON.stringify(schema)}'`);
    }

    const templateData = TYPE[schema.type](core, schema, data, pointer); // eslint-disable-line no-use-before-define
    return templateData;
}


const TYPE = {
    "string": (core, schema, data) => getDefault(schema, data, ""),
    "number": (core, schema, data) => getDefault(schema, data, 0),
    "integer": (core, schema, data) => getDefault(schema, data, 0),
    "boolean": (core, schema, data) => getDefault(schema, data, false),
    "object": (core, schema, data, pointer) => {
        const template = schema.default === undefined ? {} : schema.default;
        const d = data || {};

        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                const value = (data == null || data[key] == null) ? template[key] : data[key];
                d[key] = getTemplate(core, value, schema.properties[key], `${pointer}/properties/{${key}}`);
            });
        }

        return d;
    },
    // build array type of items, ignores additionalItems
    "array": (core, schema, data, pointer) => {
        const template = schema.default === undefined ? [] : schema.default;
        const d = data || [];
        schema.minItems = schema.minItems || 0;

        // items are undefined
        if (schema.items == null) {
            return d;
        }

        // build defined set of items
        if (Array.isArray(schema.items)) {
            for (let i = 0, l = Math.min(schema.minItems, schema.items.length); i < l; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], schema.items[i], `${pointer}/items/{${i}}`);
            }
            return d;
        }

        // abort if the schema is invalid
        if (getTypeOf(schema.items) !== "object") {
            return d;
        }

        // resolve allOf and first anyOf definition
        const templateSchema = createTemplateSchema(core, schema.items, data, pointer);
        if (templateSchema === false) {
            return d;
        }
        pointer = templateSchema.pointer || pointer;

        // build oneOf
        if (templateSchema.oneOf && d.length === 0) {
            const oneOfSchema = templateSchema.oneOf[0];
            for (let i = 0; i < schema.minItems; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], oneOfSchema, `${pointer}/oneOf/0`);
            }
            return d;
        }

        if (templateSchema.oneOf && d.length > 0) {
            const itemCount = Math.max(schema.minItems, d.length);
            for (let i = 0; i < itemCount; i += 1) {
                const value = d[i] == null ? template[i] : d[i];
                const one = resolveOneOfFuzzy(core, value, templateSchema);
                if (one) {
                    d[i] = getTemplate(core, value, one, `${pointer}/oneOf/${i}`);
                } else {
                    d[i] = value;
                }
            }
            return d;
        }

        // build items-definition
        if (templateSchema.type) {
            for (let i = 0, l = Math.max(schema.minItems, d.length); i < l; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], templateSchema, `${pointer}/items`);
            }
            return d;
        }

        return d;
    }
};


function getDefault(schema, templateValue, initValue) {
    if (templateValue != null) {
        return templateValue;
    } else if (schema.default === undefined && Array.isArray(schema.enum)) {
        return schema.enum[0];
    } else if (schema.default === undefined) {
        return initValue;
    }
    return schema.default;
}


module.exports = (core, data, schema = core.rootSchema) => {
    cache = { "mi": ".." };
    return getTemplate(core, data, schema, "#");
};
