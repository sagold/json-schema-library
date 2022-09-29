const Types = {
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
        definitions: [
            "allOf/*",
            "anyOf/*",
            "oneOf/*",
            "not",
            "items",
            "items/*",
            "additionalItems"
        ],
        validationKeywords: ["minItems", "maxItems", "uniqueItems"],
        keywords: ["items", "additionalItems", "minItems", "maxItems", "uniqueItems"]
    },
    boolean: {
        type: true
    },
    enum: {
        type: false
    },
    integer: {
        type: true,
        definitions: ["allOf/*", "anyOf/*", "oneOf/*", "not"],
        validationKeywords: ["minimum", "maximum", "multipleOf"]
    },
    not: {
        type: false,
        definitions: ["not"]
    },
    number: {
        type: true,
        definitions: ["allOf/*", "anyOf/*", "oneOf/*", "not"],
        validationKeywords: ["minimum", "maximum", "multipleOf"]
    },
    null: {
        type: true
    },
    object: {
        type: true,
        // patternProperties also validate properties
        // dependencies:(string, TypeDef) extend current TypeDef
        // additional Properties validate only remaining properties (after properties & pattern)
        definitions: [
            "allOf/*",
            "anyOf/*",
            "oneOf/*",
            "not",
            "properties/*",
            "additionalProperties",
            "patternProperties/*",
            "dependencies/*"
        ],
        validationKeywords: ["minProperties", "maxProperties", "required"],
        keywords: [
            "properties",
            "additionalProperties",
            "patternProperties",
            "dependencies",
            "minProperties",
            "maxProperties",
            "required"
        ]
    },
    oneOf: {
        type: false,
        definitions: ["oneOf/*"]
    },
    string: {
        type: true,
        definitions: ["allOf/*", "anyOf/*", "oneOf/*", "not"],
        validationKeywords: ["minLength", "maxLength", "pattern"]
    }
};
export default Types;
