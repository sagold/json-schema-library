declare namespace _default {
    let $schema: string;
    let $id: string;
    let $dynamicAnchor: string;
    let title: string;
    let type: string[];
    namespace properties {
        export namespace type_1 {
            let anyOf: ({
                $ref: string;
                type?: undefined;
                items?: undefined;
                minItems?: undefined;
                uniqueItems?: undefined;
            } | {
                type: string;
                items: {
                    $ref: string;
                };
                minItems: number;
                uniqueItems: boolean;
                $ref?: undefined;
            })[];
        }
        export { type_1 as type };
        let _const: boolean;
        export { _const as const };
        export namespace _enum {
            let type_2: string;
            export { type_2 as type };
            export let items: boolean;
        }
        export { _enum as enum };
        export namespace multipleOf {
            let type_3: string;
            export { type_3 as type };
            export let exclusiveMinimum: number;
        }
        export namespace maximum {
            let type_4: string;
            export { type_4 as type };
        }
        export namespace exclusiveMaximum {
            let type_5: string;
            export { type_5 as type };
        }
        export namespace minimum {
            let type_6: string;
            export { type_6 as type };
        }
        export namespace exclusiveMinimum_1 {
            let type_7: string;
            export { type_7 as type };
        }
        export { exclusiveMinimum_1 as exclusiveMinimum };
        export namespace maxLength {
            let $ref: string;
        }
        export namespace minLength {
            let $ref_1: string;
            export { $ref_1 as $ref };
        }
        export namespace pattern {
            let type_8: string;
            export { type_8 as type };
            export let format: string;
        }
        export namespace maxItems {
            let $ref_2: string;
            export { $ref_2 as $ref };
        }
        export namespace minItems {
            let $ref_3: string;
            export { $ref_3 as $ref };
        }
        export namespace uniqueItems {
            let type_9: string;
            export { type_9 as type };
            let _default: boolean;
            export { _default as default };
        }
        export namespace maxContains {
            let $ref_4: string;
            export { $ref_4 as $ref };
        }
        export namespace minContains {
            let $ref_5: string;
            export { $ref_5 as $ref };
            let _default_1: number;
            export { _default_1 as default };
        }
        export namespace maxProperties {
            let $ref_6: string;
            export { $ref_6 as $ref };
        }
        export namespace minProperties {
            let $ref_7: string;
            export { $ref_7 as $ref };
        }
        export namespace required {
            let $ref_8: string;
            export { $ref_8 as $ref };
        }
        export namespace dependentRequired {
            let type_10: string;
            export { type_10 as type };
            export namespace additionalProperties {
                let $ref_9: string;
                export { $ref_9 as $ref };
            }
        }
    }
    namespace $defs {
        namespace nonNegativeInteger {
            let type_11: string;
            export { type_11 as type };
            let minimum_1: number;
            export { minimum_1 as minimum };
        }
        namespace nonNegativeIntegerDefault0 {
            let $ref_10: string;
            export { $ref_10 as $ref };
            let _default_2: number;
            export { _default_2 as default };
        }
        namespace simpleTypes {
            let _enum_1: string[];
            export { _enum_1 as enum };
        }
        namespace stringArray {
            let type_12: string;
            export { type_12 as type };
            export namespace items_1 {
                let type_13: string;
                export { type_13 as type };
            }
            export { items_1 as items };
            let uniqueItems_1: boolean;
            export { uniqueItems_1 as uniqueItems };
            let _default_3: any[];
            export { _default_3 as default };
        }
    }
}
export default _default;
