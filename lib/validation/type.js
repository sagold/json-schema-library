const getTypeOf = require("../getTypeOf");
const validateKeyword = require("./keyword");
const Errors = require("./errors");

function errorFilter(error) {
    return error instanceof Error;
}

const TypeValidation = {

    validate(schema, data, step, root, pointer) {
        const type = getTypeOf(data);
        if (type !== schema.type) {
            return [new Errors.TypeMismatchError({ received: type, expected: schema.type, pointer })];
        }
        if (TypeValidation[type] == null) {
            return [new Errors.InvalidTypeError({ type, pointer })];
        }
        return TypeValidation[type](schema, data, step, root, pointer);
    },

    array: (schema, value, step, root, pointer) => {
        if (value == null) {
            return [new Errors.UndefinedValueError({ pointer })];
        }

        const errors = [
            validateKeyword.minItems(schema, value, pointer),
            validateKeyword.maxItems(schema, value, pointer)
        ];

        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = step(i, schema, value, root);
            const itemErrors = TypeValidation.validate(itemSchema, itemData, step, root);
            errors.push(...itemErrors);
        }

        return errors.filter(errorFilter);
    },
    object: (schema, value, step, root, pointer) => {
        if (value == null) {
            return [new Errors.UndefinedValueError({ pointer })];
        }

        const errors = [
            validateKeyword.minProperties(schema, value, pointer),
            validateKeyword.maxProperties(schema, value, pointer)
        ];

        // validate properties
        // @todo: missing: required, additionalProperties, patternProperties
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const itemSchema = step(key, schema, value, root);
            if (value[key] === undefined) {
                errors.push(new Errors.MissingKeyError({ key, pointer }));
            } else {
                const keyErrors = TypeValidation.validate(itemSchema, value[key], step, root);
                errors.push(...keyErrors);
            }
        }

        return errors.filter(errorFilter);
    },

    string: (schema, value, pointer) => [
        validateKeyword.minLength(schema, value, pointer),
        validateKeyword.maxLength(schema, value, pointer),
        validateKeyword.pattern(schema, value, pointer)
    ].filter(errorFilter),

    number: (schema, value, pointer) => [
        validateKeyword.minimum(schema, value, pointer),
        validateKeyword.maximum(schema, value, pointer)
    ].filter(errorFilter),

    "boolean": () => [],

    "null": () => []
};


module.exports = TypeValidation;

