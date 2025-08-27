export default {
    DECLARATOR_ONEOF: "oneOfProperty",
    propertyBlacklist: ["_id"],
    DYNAMIC_PROPERTIES: [
        "$ref",
        "$defs",
        "if",
        "then",
        "else",
        "allOf",
        "anyOf",
        "oneOf",
        "dependentSchemas",
        "dependentRequired",
        "definitions",
        "dependencies",
        "patternProperties"
    ],
    REGEX_FLAGS: "u"
};
