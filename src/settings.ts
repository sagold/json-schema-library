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
        "patternProperties",
        "propertyDependencies"
    ],
    REGEX_FLAGS: "u",
    /**
     * properties to keep from a $ref-schema when resolving a $ref (recursively)
     * this allows to overwrite specified properties locally on a $ref-definition
     *
     * - draft 2019-09
     * - draft 2020-12
     *
     * @example
     * {
     *   title: "custom component",
     *   $ref: "#/$defs/component",
     *
     *   $defs: {
     *     component: {
     *       title: "component",
     *       type: "object"
     *     }
     *   }
     * }
     * // results in
     * {
     *   title: "custom component"
     *   type: "object"
     * }
     */
    PROPERTIES_TO_MERGE: ["title", "description", "options", "x-options", "readOnly", "writeOnly"]
};
