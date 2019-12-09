/* eslint quote-props: 0 */
const resolveOneOfFuzzy = require("./resolveOneOf.fuzzy");
const getTypeOf = require("./getTypeOf");
const merge = require("./utils/merge");
const copy = require("./utils/copy");
const settings = require("./config/settings");


let cache;

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

    // if (pointer == null) {
    //     throw new Error("Missing pointer in resolveRef");
    // }

    // console.log("resolve $ref", schema.$ref, "from", pointer);

    const id = JSON.stringify(schema);
    cache[id] = cache[id] || 0;
    cache[id] += 1;
    console.log(id, cache[id]);
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
function createTemplateSchema(core, schema, data) {
    if (getTypeOf(schema) !== "object") {
        return schema;
    }

    if (schema.$ref) {
        if (shouldResolveRef(schema) === false && data == null) {
            console.log("ABORT WITH DATA", data);
            return false;
        }
    }

    let templateSchema = copy(resolveRef(core, schema));
    // let templateSchema = copy(core.resolveRef(schema));

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
        templateSchema = merge(templateSchema, core.resolveRef(schema.anyOf[0]));
        delete templateSchema.anyOf;
    }

    if (Array.isArray(schema.allOf)) {
        for (let i = 0, l = schema.allOf.length; i < l; i += 1) {
            templateSchema = merge(templateSchema, core.resolveRef(schema.allOf[i]));
        }
        delete templateSchema.allOf;
    }

    return templateSchema;
}

function shouldResolveRef(schema) {
    const id = JSON.stringify(schema);
    return (cache[id] == null || cache[id] < settings.GET_TEMPLATE_RECURSION_LIMIT);
}


/**
 * Create data object matching the given schema
 *
 * @param  {CoreInterface} core     - json schema core
 * @param  {Mixed} [data]           - optional template data
 * @param  {Object} [schema]        - json schema, defaults to rootSchema
 * @return {Mixed} created template data
 */
function getTemplate(core, data, schema, pointer) {
    if (schema == null) {
        throw new Error("getTemplate: missing schema for data", data);
    }

    if (pointer == null) {
        throw new Error("Missing pointer");
    }

    if (schema.$ref) {
        if (shouldResolveRef(schema) === false && data == null) {
            return undefined;
        }
        // @todo all $refs should be resolved
        pointer = schema.$ref;
    }

    console.log("getTemplate", pointer, data);

    // resolve $ref references, allOf and first anyOf definitions
    schema = createTemplateSchema(core, schema, pointer);

    if (schema.oneOf) {
        // find correct schema for data
        const resolvedSchema = resolveOneOfFuzzy(core, data, schema);
        if (data == null && resolvedSchema.type === "error") {
            schema = schema.oneOf[0];
        } else if (resolvedSchema.type === "error") {
            // return resolvedSchema;
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

    if (data != null && getTypeOf(data) !== schema.type) {
        // reset invalid type
        // console.error("Schema does not match data", data, "schema:", schema);
        data = convertValue(schema.type, data);
    }

    // eslint-disable-next-line no-use-before-define
    if (TYPE[schema.type] == null) {
        throw new Error(`Unsupported type '${schema.type} in ${JSON.stringify(schema)}'`);
    }

    // eslint-disable-next-line no-use-before-define
    const templateData = TYPE[schema.type](core, schema, data, pointer);

    return templateData;
}


const TYPE = {
    "string": (core, schema, data) => getDefault(schema, data, ""),
    "number": (core, schema, data) => getDefault(schema, data, 0),
    "integer": (core, schema, data) => getDefault(schema, data, 0),
    "boolean": (core, schema, data) => getDefault(schema, data, false),
    "object": (core, schema, data, pointer) => {
        const template = schema.default === undefined ? {} : schema.default;
        data = data || {};

        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                const value = data[key] == null ? template[key] : data[key];
                data[key] = getTemplate(core, value, schema.properties[key], `${pointer}/${key}`);
            });
        }

        return data;
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
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], schema.items[i], `${pointer}/${i}`);
            }
            return d;
        }

        // abort if the schema is invalid
        if (getTypeOf(schema.items) !== "object") {
            return d;
        }

        // resolve allOf and first anyOf definition
        const templateSchema = createTemplateSchema(core, schema.items, data && data.length === 0 ? null : data);
        if (templateSchema === false) {
            return d;
        }

        // build oneOf
        if (templateSchema.oneOf && d.length === 0) {
            for (let i = 0; i < schema.minItems; i += 1) {
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], templateSchema.oneOf[0], `${pointer}/oneOf/${i}`);
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
                d[i] = getTemplate(core, d[i] == null ? template[i] : d[i], templateSchema, `${pointer}/${i}`);
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
