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
            return [core.errors.undefinedValueError({ pointer })];
        }

        const errors = core.typeKeywords.array
            .filter((key) => schema && schema[key] != null)
            .map((key) => core.validateKeyword[key](core, schema, value, pointer));

        // validate items
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = core.step(i, schema, value, pointer);

            if (itemSchema && itemSchema.type === "error") {
                return [itemSchema];
            }

            const itemErrors = core.validate(itemSchema, itemData, join(pointer, i));
            errors.push(...itemErrors);
        }

        return errors;
    },

    object: (core, schema, value, pointer) => {
        if (value == null) {
            return [core.errors.undefinedValueError({ pointer })];
        }

        const errors = core.typeKeywords.object
            .filter((key) => schema && schema[key] != null)
            .map((key) => core.validateKeyword[key](core, schema, value, pointer));

        // validate properties
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const itemSchema = core.step(key, schema, value, pointer);
            if (value[key] === undefined) {
                errors.push(core.errors.missingKeyError({ key, pointer }));
            } else {
                const keyErrors = core.validate(itemSchema, value[key], join(pointer, key));
                errors.push(...keyErrors);
            }
        }

        return errors;
    },

    string: (core, schema, value, pointer) =>
        core.typeKeywords.string
            .filter((key) => schema && schema[key] != null)
            .map((key) => core.validateKeyword[key](core, schema, value, pointer)),

    integer: (core, schema, value, pointer) =>
        core.typeKeywords.number
            .filter((key) => schema && schema[key] != null)
            .map((key) => core.validateKeyword[key](core, schema, value, pointer)),

    number: (core, schema, value, pointer) =>
        core.typeKeywords.number
            .filter((key) => schema && schema[key] != null)
            .map((key) => core.validateKeyword[key](core, schema, value, pointer)),

    "boolean": (core, schema, value, pointer) =>
        core.typeKeywords.boolean
            .filter((key) => schema && schema[key] != null)
            .map((key) => core.validateKeyword[key](core, schema, value, pointer)),

    "null": () => []
};

function join(...args) {
    return args.join("/");
}


module.exports = TypeValidation;
