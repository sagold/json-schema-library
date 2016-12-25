const getTypeOf = require("../getTypeOf");

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

    array: (core, schema, value, pointer) => {
        if (value == null) {
            return [new core.errors.UndefinedValueError({ pointer })];
        }

        const errors = [
            core.validateKeyword.minItems(core, schema, value, pointer),
            core.validateKeyword.maxItems(core, schema, value, pointer),
            core.validateKeyword.not(core, schema, value, pointer)
            // enum??
        ];

        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = core.step(i, schema, value, pointer);

            if (itemSchema instanceof Error) {
                return [itemSchema];
            }

            const itemErrors = core.validate(itemSchema, itemData, join(pointer, i));
            errors.push(...itemErrors);
        }

        return errors.filter(errorFilter);
    },

    object: (core, schema, value, pointer) => {
        if (value == null) {
            return [new core.errors.UndefinedValueError({ pointer })];
        }

        const errors = [
            core.validateKeyword.minProperties(core, schema, value, pointer),
            core.validateKeyword.maxProperties(core, schema, value, pointer),
            core.validateKeyword.additionalProperties(core, schema, value, pointer),
            core.validateKeyword.not(core, schema, value, pointer)
            // enum??
        ];

        // validate properties
        // @todo: missing: required, additionalProperties, patternProperties
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const itemSchema = core.step(key, schema, value, pointer);
            if (value[key] === undefined) {
                errors.push(new core.errors.MissingKeyError({ key, pointer }));
            } else {
                const keyErrors = core.validate(itemSchema, value[key], join(pointer, key));
                errors.push(...keyErrors);
            }
        }

        return errors.filter(errorFilter);
    },

    string: (core, schema, value, pointer) => [
        core.validateKeyword.format(core, schema, value, pointer),
        core.validateKeyword.minLength(core, schema, value, pointer),
        core.validateKeyword.maxLength(core, schema, value, pointer),
        core.validateKeyword.enum(core, schema, value, pointer),
        core.validateKeyword.pattern(core, schema, value, pointer),
        core.validateKeyword.not(core, schema, value, pointer)
    ].filter(errorFilter),

    integer: (core, schema, value, pointer) => core.validateType.number(core, schema, value, pointer),

    number: (core, schema, value, pointer) => [
        core.validateKeyword.enum(core, schema, value, pointer),
        core.validateKeyword.format(core, schema, value, pointer),
        core.validateKeyword.maximum(core, schema, value, pointer),
        core.validateKeyword.minimum(core, schema, value, pointer),
        core.validateKeyword.multipleOf(core, schema, value, pointer),
        core.validateKeyword.not(core, schema, value, pointer)
    ].filter(errorFilter),

    "boolean": () => [],

    "null": () => []
};


module.exports = TypeValidation;
