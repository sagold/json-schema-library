declare namespace _default {
    let $schema: string;
    let $id: string;
    let $dynamicAnchor: string;
    let title: string;
    let type: string[];
    namespace properties {
        export namespace prefixItems {
            let $ref: string;
        }
        export namespace items {
            let $dynamicRef: string;
        }
        export namespace contains {
            let $dynamicRef_1: string;
            export { $dynamicRef_1 as $dynamicRef };
        }
        export namespace additionalProperties {
            let $dynamicRef_2: string;
            export { $dynamicRef_2 as $dynamicRef };
        }
        export namespace properties_1 {
            let type_1: string;
            export { type_1 as type };
            export namespace additionalProperties_1 {
                let $dynamicRef_3: string;
                export { $dynamicRef_3 as $dynamicRef };
            }
            export { additionalProperties_1 as additionalProperties };
            let _default: {};
            export { _default as default };
        }
        export { properties_1 as properties };
        export namespace patternProperties {
            let type_2: string;
            export { type_2 as type };
            export namespace additionalProperties_2 {
                let $dynamicRef_4: string;
                export { $dynamicRef_4 as $dynamicRef };
            }
            export { additionalProperties_2 as additionalProperties };
            export namespace propertyNames {
                let format: string;
            }
            let _default_1: {};
            export { _default_1 as default };
        }
        export namespace dependentSchemas {
            let type_3: string;
            export { type_3 as type };
            export namespace additionalProperties_3 {
                let $dynamicRef_5: string;
                export { $dynamicRef_5 as $dynamicRef };
            }
            export { additionalProperties_3 as additionalProperties };
            let _default_2: {};
            export { _default_2 as default };
        }
        export namespace propertyNames_1 {
            let $dynamicRef_6: string;
            export { $dynamicRef_6 as $dynamicRef };
        }
        export { propertyNames_1 as propertyNames };
        export namespace _if {
            let $dynamicRef_7: string;
            export { $dynamicRef_7 as $dynamicRef };
        }
        export { _if as if };
        export namespace then {
            let $dynamicRef_8: string;
            export { $dynamicRef_8 as $dynamicRef };
        }
        export namespace _else {
            let $dynamicRef_9: string;
            export { $dynamicRef_9 as $dynamicRef };
        }
        export { _else as else };
        export namespace allOf {
            let $ref_1: string;
            export { $ref_1 as $ref };
        }
        export namespace anyOf {
            let $ref_2: string;
            export { $ref_2 as $ref };
        }
        export namespace oneOf {
            let $ref_3: string;
            export { $ref_3 as $ref };
        }
        export namespace not {
            let $dynamicRef_10: string;
            export { $dynamicRef_10 as $dynamicRef };
        }
    }
    namespace $defs {
        namespace schemaArray {
            let type_4: string;
            export { type_4 as type };
            export let minItems: number;
            export namespace items_1 {
                let $dynamicRef_11: string;
                export { $dynamicRef_11 as $dynamicRef };
            }
            export { items_1 as items };
        }
    }
}
export default _default;
