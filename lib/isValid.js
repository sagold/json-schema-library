/* eslint quote-props: 0 */
const getTypeOf = require("./getTypeOf");
const typeValidation = {
    string: (schema, value) => {
        if (schema.minLength && schema.minLength > value.length) {
            return false;
        } else if (schema.maxLength && schema.maxLength < value.length) {
            return false;
        }
        return validPattern(schema, value);
    },
    number: (schema, value) => {
        if (schema.minimum && schema.minimum > value) {
            return false;
        } else if (schema.maximum && schema.maximum < value) {
            return false;
        }
        return schema;
    },
    array: (schema, value) => {
        if (value == null) {
            return false;
        }
        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        // @todo: use step and resolveRef
        for (var i = 0; i < value.length; i += 1) {
            const item = value[i];
            if (isValid(item, schema.items || { type: getTypeOf(item) }) === false) {
                return false;
            }
        }
        // validation
        if (isNaN(schema.minItems) === false && schema.minItems > value.length) {
            return false;
        }
        if (isNaN(schema.maxItems) === false && schema.maxItems < value.length) {
            return false;
        }
        return schema;
    },
    object: (schema, value) => {
        if (value == null) {
            return false;
        }
        // validate properties
        // @todo: missing: required, additionalProperties, patternProperties
        // @todo: use step and resolveRef
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] === undefined || isValid(value[key], schema.properties[key]) === false) {
                return false;
            }
        }
        // validation
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.minProperties) === false && schema.minProperties > propertyCount) {
            return false;
        }
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return false;
        }
        return schema;
    },
    boolean: (schema) => schema,
    null: (schema) => schema
};


/**
 * Test if the data is valid according to the given schema
 *
 * @param  {Mixed} data     - data to validate
 * @param  {Schema} schema  - json schema
 * @return {Mixed|false} the json schema or false if schema does not match data
 */
function isValid(data, schema) {
    const type = getTypeOf(data);
    if (type !== schema.type) {
        return false;
    }
    if (typeValidation[type] == null) {
        return false;
    }
    return typeValidation[type](schema, data);
}


/**
 * Validate any given pattern
 * @param  {Object} schema
 * @param  {Mixed} value
 * @return {Object|Boolean} schema or false
 */
function validPattern(schema, value) {
    if (schema.pattern) {
        const pattern = new RegExp(schema.pattern);
        return pattern.test(value) ? schema : false;
    }
    return schema;
}


module.exports = isValid;
