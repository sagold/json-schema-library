/* eslint quote-props: 0 */


/**
 * Create data object matching the given schema
 *
 * @TODO
 *  - walk through schema by shared helper functions (dry)
 *  - add support for oneOf
 *  - add support for $ref
 *
 * @param  {Object} schema          - json schema
 * @param  {Mixed} [data]           - optional template data
 * @param  {Object} [rootSchema]    - schema serving as entry point for json pointer ('#/...'). Defaults to schema
 * @return {Mixed} created template data
 */
function getTemplate(core, schema, data) {
    // resolve $ref references
    schema = core.resolveRef(schema);
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
    "boolean": (core, schema, data) => getDefault(schema, data, false),
    "object": (core, schema, data) => {
        const template = schema.default || {};
        data = data || {};
        if (schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
                data[key] = core.getTemplate(schema.properties[key], data[key] || template[key]);
            });
        } else if (schema.oneOf && (schema.oneOf.length === 1 || Object.keys(data).length === 0)) {
            // may throw if #/oneOf/*/type !== "object"
            return core.getTemplate(schema.oneOf[0], data);
        } else if (schema.oneOf) {
            const one = core.resolveOneOf(schema, data);
            if (one) {
                return core.getTemplate(one, data);
            }
            console.log("Failed resolving oneOf", schema.oneOf, data);
        }
        return data;
    },
    "array": (core, schema, data) => {
        const template = schema.default || [];
        data = data || [];
        schema.minItems = schema.minItems || 0;
        if (schema.items.oneOf && data.length === 0) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = core.getTemplate(schema.items.oneOf[0], data[i] || template[i]);
            }
        } else if (schema.items.oneOf && data.length > 0) {
            const itemCount = Math.max(schema.minItems, data.length);
            for (let i = 0; i < itemCount; i += 1) {
                const value = data[i] || template[i];
                const one = core.resolveOneOf(schema.items, value);
                if (one) {
                    data[i] = core.getTemplate(one, value);
                } else {
                    data[i] = value;
                }
            }
        } else if (schema.items.type) {
            for (let i = 0; i < schema.minItems; i += 1) {
                data[i] = core.getTemplate(schema.items, data[i] || template[i]);
            }
        } else if (Array.isArray(schema.items)) {
            for (let i = 0, l = Math.min(schema.minItems, schema.items.length); i < l; i += 1) {
                data[i] = core.getTemplate(schema.items[i], data[i] || template[i]);
            }
        }

        return data;
    }
};


function getDefault(schema, templateValue, initValue) {
    if (templateValue != null) {
        return templateValue;
    } else if (schema.default === undefined) {
        return initValue;
    }
    return schema.default;
}


module.exports = getTemplate;
