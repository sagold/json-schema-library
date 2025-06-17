declare namespace _default {
    let $schema: string;
    let $id: string;
    let $recursiveAnchor: boolean;
    let title: string;
    let type: string[];
    namespace properties {
        export namespace additionalItems {
            let $recursiveRef: string;
        }
        export namespace unevaluatedItems {
            let $recursiveRef_1: string;
            export { $recursiveRef_1 as $recursiveRef };
        }
        export namespace items {
            let anyOf: ({
                $recursiveRef: string;
                $ref?: undefined;
            } | {
                $ref: string;
                $recursiveRef?: undefined;
            })[];
        }
        export namespace contains {
            let $recursiveRef_2: string;
            export { $recursiveRef_2 as $recursiveRef };
        }
        export namespace additionalProperties {
            let $recursiveRef_3: string;
            export { $recursiveRef_3 as $recursiveRef };
        }
        export namespace unevaluatedProperties {
            let $recursiveRef_4: string;
            export { $recursiveRef_4 as $recursiveRef };
        }
        export namespace properties_1 {
            let type_1: string;
            export { type_1 as type };
            export namespace additionalProperties_1 {
                let $recursiveRef_5: string;
                export { $recursiveRef_5 as $recursiveRef };
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
                let $recursiveRef_6: string;
                export { $recursiveRef_6 as $recursiveRef };
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
                let $recursiveRef_7: string;
                export { $recursiveRef_7 as $recursiveRef };
            }
            export { additionalProperties_3 as additionalProperties };
        }
        export namespace propertyNames_1 {
            let $recursiveRef_8: string;
            export { $recursiveRef_8 as $recursiveRef };
        }
        export { propertyNames_1 as propertyNames };
        export namespace _if {
            let $recursiveRef_9: string;
            export { $recursiveRef_9 as $recursiveRef };
        }
        export { _if as if };
        export namespace then {
            let $recursiveRef_10: string;
            export { $recursiveRef_10 as $recursiveRef };
        }
        export namespace _else {
            let $recursiveRef_11: string;
            export { $recursiveRef_11 as $recursiveRef };
        }
        export { _else as else };
        export namespace allOf {
            let $ref: string;
        }
        export namespace anyOf_1 {
            let $ref_1: string;
            export { $ref_1 as $ref };
        }
        export { anyOf_1 as anyOf };
        export namespace oneOf {
            let $ref_2: string;
            export { $ref_2 as $ref };
        }
        export namespace not {
            let $recursiveRef_12: string;
            export { $recursiveRef_12 as $recursiveRef };
        }
    }
    namespace $defs {
        namespace schemaArray {
            let type_4: string;
            export { type_4 as type };
            export let minItems: number;
            export namespace items_1 {
                let $recursiveRef_13: string;
                export { $recursiveRef_13 as $recursiveRef };
            }
            export { items_1 as items };
        }
    }
}
export default _default;
