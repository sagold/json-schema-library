/* eslint quote-props: 0 */
const resolveOneOfFuzzy = require("./resolveOneOf.fuzzy");
const getTypeOf = require("./getTypeOf");

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
    } catch (e) {
        return null;
    }
}


/**
 * Create data object matching the given schema
 *
 * @param  {CoreInterface} core     - json schema core
 * @param  {Object} schema          - json schema
 * @param  {Mixed} [data]           - optional template data
 * @return {Mixed} created template data
 */
function getTemplate(core, schema, data) {
    if (schema == null) {
        throw new Error("geTemplate: missing schema for data", data);
    }

    if (schema.oneOf) {
        // find correct schema for data
        const resolvedSchema = resolveOneOfFuzzy(core, schema, data);
        if (data == null && resolvedSchema.type === "error") {
            schema = schema.oneOf[0];
        } else if (resolvedSchema.type === "error") {
            return resolvedSchema;

        } else {
            schema = resolvedSchema;
        }
    }

    // resolve $ref references
    schema = core.resolveRef(schema);

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
    return TYPE[schema.type](core, schema, data);
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
            Object.keys(schema.properties).forEach((key) => {
                data[key] = core.getTemplate(schema.properties[key], data[key] == null ? template[key] : data[key]);
            });
        }

        return data;
    },
    "array": (core, schema, data) => {
        const template = schema.default === undefined ? [] : schema.default;
        data = data || [];
        schema.minItems = schema.minItems || 0;
        if (schema.items == null) {
            return data;
        } else if (schema.items.oneOf && data.length === 0) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = core.getTemplate(schema.items.oneOf[0], data[i] == null ? template[i] : data[i]);
            }
        } else if (schema.items.oneOf && data.length > 0) {
            const itemCount = Math.max(schema.minItems, data.length);
            for (let i = 0; i < itemCount; i += 1) {
                const value = data[i] == null ? template[i] : data[i];
                const one = resolveOneOfFuzzy(core, schema.items, value);
                if (one) {
                    data[i] = core.getTemplate(one, value);
                } else {
                    data[i] = value;
                }
            }
        } else if (schema.items.type) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = core.getTemplate(schema.items, data[i] == null ? template[i] : data[i]);
            }
        } else if (Array.isArray(schema.items)) {
            for (let i = 0, l = Math.min(schema.minItems, schema.items.length); i < l; i += 1) {
                data[i] = core.getTemplate(schema.items[i], data[i] == null ? template[i] : data[i]);
            }
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


module.exports = getTemplate;
