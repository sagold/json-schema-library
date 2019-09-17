/* eslint quote-props: 0 */
const resolveOneOfFuzzy = require("./resolveOneOf.fuzzy");
const getTypeOf = require("./getTypeOf");
const copy = require("./utils/copy");
const merge = require("./utils/merge");


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
 * Create data object matching the given schema
 *
 * @param  {CoreInterface} core     - json schema core
 * @param  {Mixed} [data]           - optional template data
 * @param  {Object} [schema]        - json schema, defaults to rootSchema
 * @return {Mixed} created template data
 */
function getTemplate(core, data, schema = core.rootSchema) {
    if (schema == null) {
        throw new Error("geTemplate: missing schema for data", data);
    }

    if (schema.oneOf) {
        // find correct schema for data
        const resolvedSchema = resolveOneOfFuzzy(core, data, schema);
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

        let currentSchema;
        if (Array.isArray(schema.allOf)) {
            currentSchema = currentSchema || copy(schema);
            for (let i = 0, l = currentSchema.allOf.length; i < l; i += 1) {
                currentSchema = merge(currentSchema, core.resolveRef(currentSchema.allOf[i]));
            }
            delete currentSchema.allOf;
        }

        if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
            currentSchema = currentSchema || copy(schema);
            currentSchema = merge(currentSchema, core.resolveRef(currentSchema.anyOf[0]));
            delete currentSchema.anyOf;
        }

        currentSchema = currentSchema || schema;

        if (currentSchema.properties) {
            Object.keys(currentSchema.properties).forEach(key => {
                const value = data[key] == null ? template[key] : data[key];
                data[key] = core.getTemplate(value, currentSchema.properties[key]);
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
                data[i] = core.getTemplate(data[i] == null ? template[i] : data[i], schema.items[i]);
            }
            return data;
        }

        // abort if the schema is invalid
        if (getTypeOf(schema.items) !== "object") {
            return data;
        }

        // build oneOf
        if (schema.items.oneOf && data.length === 0) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = core.getTemplate(data[i] == null ? template[i] : data[i], schema.items.oneOf[0]);
            }
            return data;
        }

        if (schema.items.oneOf && data.length > 0) {
            const itemCount = Math.max(schema.minItems, data.length);
            for (let i = 0; i < itemCount; i += 1) {
                const value = data[i] == null ? template[i] : data[i];
                const one = resolveOneOfFuzzy(core, value, schema.items);
                if (one) {
                    data[i] = core.getTemplate(value, one);
                } else {
                    data[i] = value;
                }
            }
            return data;
        }

        // build allOf
        if (Array.isArray(schema.items.allOf)) {
            const allOf = schema.items.allOf;
            let mergedSchema = copy(schema.items);
            for (let i = 0; i < allOf.length; i += 1) {
                mergedSchema = merge(mergedSchema, core.resolveRef(allOf[i]));
            }
            delete mergedSchema.allOf;
            for (let i = 0, l = Math.max(schema.minItems, data.length); i < l; i += 1) {
                data[i] = core.getTemplate(data[i] == null ? template[i] : data[i], mergedSchema);
            }
            return data;
        }

        // build anyOf
        if (Array.isArray(schema.items.anyOf)) {
            const anyOf = schema.items.anyOf;
            let mergedSchema = copy(schema.items);
            if (anyOf.length > 0) {
                mergedSchema = merge(mergedSchema, core.resolveRef(anyOf[0]));
            }
            delete mergedSchema.anyOf;
            for (let i = 0, l = Math.max(schema.minItems, data.length); i < l; i += 1) {
                data[i] = core.getTemplate(data[i] == null ? template[i] : data[i], mergedSchema);
            }
            return data;
        }

        // build items-definition
        if (schema.items.type) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = core.getTemplate(data[i] == null ? template[i] : data[i], schema.items);
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


module.exports = getTemplate;
