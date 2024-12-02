export default {
    DECLARATOR_ONEOF: "oneOfProperty",
    /** set to false to not set __oneOfIndex on returned schema */
    EXPOSE_ONE_OF_INDEX: true,
    GET_TEMPLATE_RECURSION_LIMIT: 1,
    propertyBlacklist: ["_id"],
    templateDefaultOptions: {
        addOptionalProps: false,
        removeInvalidData: false,
        extendDefaults: true
    }
};
