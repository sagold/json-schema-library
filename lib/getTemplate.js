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
function resolveRef(core, schema) {
    if (schema.$ref == null) {
        return schema;
    }

    const id = JSON.stringify(schema);
    if (cache[id] == null || cache[id] < settings.GET_TEMPLATE_RECURSION_LIMIT) {
        cache[id] = cache[id] || 0;
        cache[id] += 1;
        return core.resolveRef(schema);
    }
    return schema;
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
function createTemplateSchema(core, schema) {
    if (getTypeOf(schema) !== "object") {
        return schema;
    }

    let templateSchema = copy(resolveRef(core, schema));

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
        templateSchema = merge(templateSchema, resolveRef(core, schema.anyOf[0]));
        delete templateSchema.anyOf;
    }

    if (Array.isArray(schema.allOf)) {
        for (let i = 0, l = schema.allOf.length; i < l; i += 1) {
            templateSchema = merge(templateSchema, resolveRef(core, schema.allOf[i]));
        }
        delete templateSchema.allOf;
    }

    return templateSchema;
}


/**
 * Create data object matching the given schema
 *
 * @param  {CoreInterface} core     - json schema core
 * @param  {Mixed} [data]           - optional template data
 * @param  {Object} [schema]        - json schema, defaults to rootSchema
 * @return {Mixed} created template data
 */
function getTemplate(core, data, schema) {
    if (schema == null) {
        throw new Error("getTemplate: missing schema for data", data);
    }

    // resolve $ref references
    schema = resolveRef(core, schema);
    // resolve allOf and first anyOf definitions
    schema = createTemplateSchema(core, schema);

    if (schema.oneOf) {
        // find correct schema for data
        const resolvedSchema = resolveOneOfFuzzy(core, data, schema);
        if (data == null && resolvedSchema.type === "error") {
            schema = schema.oneOf[0];
        } else if (resolvedSchema.type === "error") {
            return resolvedSchema;
            // @todo - check: do not return schema, but either input-data or undefined (clearing wrong data)
            // return data;

        } else {
            schema = resolvedSchema;
        }
    }

    if (schema.type == null) {
        console.warn(`Invalid json-schema: missing property 'type' for ${data && JSON.stringify(data)}`);
        return "";
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
    const templateData = TYPE[schema.type](core, schema, data);

    return templateData;
}


const TYPE = {
    "string": (core, schema, data) => getDefault(schema, data, ""),
    "number": (core, schema, data) => getDefault(schema, data, 0),
    "integer": (core, schema, data) => getDefault(schema, data, 0),
    "boolean": (core, schema, data) => getDefault(schema, data, false),
    "object": (core, schema, data) => {
        const template = schema.default === undefined ? {} : schema.default;
        data = data || {};

        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                const value = data[key] == null ? template[key] : data[key];
                data[key] = getTemplate(core, value, schema.properties[key]);
            });
        }

        return data;
    },
    // build array type of items, ignores additionalItems
    "array": (core, schema, data) => {
        const template = schema.default === undefined ? [] : schema.default;
        data = data || [];
        schema.minItems = schema.minItems || 0;

        // items are undefined
        if (schema.items == null) {
            return data;
        }

        // build defined set of items
        if (Array.isArray(schema.items)) {
            for (let i = 0, l = Math.min(schema.minItems, schema.items.length); i < l; i += 1) {
                data[i] = getTemplate(core, data[i] == null ? template[i] : data[i], schema.items[i]);
            }
            return data;
        }

        // abort if the schema is invalid
        if (getTypeOf(schema.items) !== "object") {
            return data;
        }

        // resolve allOf and first anyOf definition
        const templateSchema = createTemplateSchema(core, schema.items);

        // build oneOf
        if (templateSchema.oneOf && data.length === 0) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = getTemplate(core, data[i] == null ? template[i] : data[i], templateSchema.oneOf[0]);
            }
            return data;
        }

        if (templateSchema.oneOf && data.length > 0) {
            const itemCount = Math.max(schema.minItems, data.length);
            for (let i = 0; i < itemCount; i += 1) {
                const value = data[i] == null ? template[i] : data[i];
                const one = resolveOneOfFuzzy(core, value, templateSchema);
                if (one) {
                    data[i] = getTemplate(core, value, one);
                } else {
                    data[i] = value;
                }
            }
            return data;
        }

        // build items-definition
        if (templateSchema.type) {
            for (let i = 0, l = Math.max(schema.minItems, data.length); i < l; i += 1) {
                data[i] = getTemplate(core, data[i] == null ? template[i] : data[i], templateSchema);
            }
            return data;
        }

        return data;
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
    return getTemplate(core, data, schema);
};
