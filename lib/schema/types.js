module.exports = {
    $ref: {
        type: false
    },
    allOf: {
        type: false,
        definitions: ["allOf/*"]
    },
    anyOf: {
        type: false,
        definitions: ["anyOf/*"]
    },
    array: {
        type: true,
        // ignore additionalItems:TypeDef, when items:TypeDef
        definitions: ["items", "items/*", "additionalItems"],
        validationKeywords: ["minItems", "maxItems", "uniqueItems"],
        keywords: ["items", "additionalItems", "minItems", "maxItems", "uniqueItems"]
    },
    "boolean": {
        type: true
    },
    "enum": {
        type: false
    },
    integer: {
        type: true,
        validationKeywords: ["minimum", "maximum", "multipleOf"]
    },
    not: {
        type: false,
        definitions: ["not"]
    },
    number: {
        type: true,
        validationKeywords: ["minimum", "maximum", "multipleOf"]
    },
    "null": {
        type: true
    },
    object: {
        type: true,
        // patternProperties also validate properties
        // dependencies:(string, TypeDef) extend current TypeDef
        // additional Properties validate only remaining properties (after properties & pattern)
        definitions: ["properties/*", "additionalProperties", "patternProperties/*", "dependencies/*"],
        validationKeywords: ["minProperties", "maxProperties", "required"],
        keywords: ["properties", "additionalProperties", "patternProperties", "dependencies", "minProperties",
            "maxProperties", "required"]
    },
    oneOf: {
        type: false,
        definitions: ["oneOf/*"]
    },
    string: {
        type: true,
        validationKeywords: ["minLength", "maxLength", "pattern"]
    }
};
