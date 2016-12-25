const getTypeOf = require("../getTypeOf");
const validateKeyword = require("./keyword");
const Errors = require("./errors");

function errorFilter(error) {
    return error instanceof Error;
}

function join(...args) {
    return args.join("/");
}

/**
 * @todo: type is also a keyword, as is properties, items, etc
 *
 * An instance has one of six primitive types (http://json-schema.org/latest/json-schema-core.html#rfc.section.4.2)
 * or seven in case of ajv https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#type
 * 1 null, 2 boolean, 3 object, 4 array, 5 number, 6 string (7 integer)
 */
const TypeValidation = {

    validate(schema, value, step, root, pointer = "#") {
        if (typeof step !== "function") { throw new Error("'step' is not a function"); }

        let receivedType = getTypeOf(value);
        const expectedType = schema.type || receivedType;

        if (expectedType === "integer" && receivedType === "number") {
            const x = parseFloat(value);
            receivedType = (x | 0) === x ? "integer" : receivedType; // eslint-disable-line no-bitwise
        }

        if (receivedType !== expectedType) {
            return [new Errors.TypeError({ received: receivedType, expected: expectedType, pointer })];
        }
        if (TypeValidation[receivedType] == null) {
            return [new Errors.InvalidTypeError({ receivedType, pointer })];
        }
        return TypeValidation[receivedType](schema, value, step, root, pointer);
    },

    array: (schema, value, step, root, pointer) => {
        if (value == null) {
            return [new Errors.UndefinedValueError({ pointer })];
        }

        const errors = [
            validateKeyword.minItems(schema, value, pointer),
            validateKeyword.maxItems(schema, value, pointer),
            validateKeyword.not(schema, value, pointer,
                (notSchema) => TypeValidation.validate(notSchema, value, step, root, pointer))
            // enum??
        ];

        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = step(i, schema, value, root, pointer, TypeValidation.validate);

            if (itemSchema instanceof Error) {
                return [itemSchema];
            }

            const itemErrors = TypeValidation.validate(itemSchema, itemData, step, root, join(pointer, i));
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
            validateKeyword.maxProperties(schema, value, pointer),
            validateKeyword.additionalProperties(schema, value, pointer,
                (additionalSchema, propertyValue) => TypeValidation.validate(additionalSchema, propertyValue, step, root, pointer)
            ),
            validateKeyword.not(schema, value, pointer,
                (notSchema) => TypeValidation.validate(notSchema, value, step, root, pointer)
            )
            // enum??
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
                const keyErrors = TypeValidation.validate(itemSchema, value[key], step, root, join(pointer, key));
                errors.push(...keyErrors);
            }
        }

        return errors.filter(errorFilter);
    },

    string: (schema, value, step, root, pointer) => [
        validateKeyword.format(schema, value, pointer),
        validateKeyword.minLength(schema, value, pointer),
        validateKeyword.maxLength(schema, value, pointer),
        validateKeyword.enum(schema, value, pointer),
        validateKeyword.pattern(schema, value, pointer),
        validateKeyword.not(schema, value, pointer,
            (notSchema) => TypeValidation.validate(notSchema, value, step, root, pointer))
    ].filter(errorFilter),

    integer: (schema, value, step, root, pointer) => TypeValidation.number(schema, value, step, root, pointer),

    number: (schema, value, step, root, pointer) => [
        validateKeyword.enum(schema, value, pointer),
        validateKeyword.format(schema, value, pointer),
        validateKeyword.maximum(schema, value, pointer),
        validateKeyword.minimum(schema, value, pointer),
        validateKeyword.multipleOf(schema, value, pointer),
        validateKeyword.not(schema, value, pointer,
            (notSchema) => TypeValidation.validate(notSchema, value, step, root, pointer))
    ].filter(errorFilter),

    "boolean": () => [],

    "null": () => []
};


module.exports = TypeValidation;
