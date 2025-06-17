declare namespace _default {
    export let $schema: string;
    export let $id: string;
    export let title: string;
    export namespace definitions {
        namespace schemaArray {
            let type: string;
            let minItems: number;
            namespace items {
                let $ref: string;
            }
        }
        namespace nonNegativeInteger {
            let type_1: string;
            export { type_1 as type };
            export let minimum: number;
        }
        namespace nonNegativeIntegerDefault0 {
            let allOf: ({
                $ref: string;
                default?: undefined;
            } | {
                default: number;
                $ref?: undefined;
            })[];
        }
        namespace simpleTypes {
            let _enum: string[];
            export { _enum as enum };
        }
        namespace stringArray {
            let type_2: string;
            export { type_2 as type };
            export namespace items_1 {
                let type_3: string;
                export { type_3 as type };
            }
            export { items_1 as items };
            export let uniqueItems: boolean;
            let _default: any[];
            export { _default as default };
        }
    }
    let type_4: string[];
    export { type_4 as type };
    export namespace properties {
        export namespace $id_1 {
            let type_5: string;
            export { type_5 as type };
            export let format: string;
        }
        export { $id_1 as $id };
        export namespace $schema_1 {
            let type_6: string;
            export { type_6 as type };
            let format_1: string;
            export { format_1 as format };
        }
        export { $schema_1 as $schema };
        export namespace $ref_1 {
            let type_7: string;
            export { type_7 as type };
            let format_2: string;
            export { format_2 as format };
        }
        export { $ref_1 as $ref };
        export namespace title_1 {
            let type_8: string;
            export { type_8 as type };
        }
        export { title_1 as title };
        export namespace description {
            let type_9: string;
            export { type_9 as type };
        }
        let _default_1: {};
        export { _default_1 as default };
        export namespace examples {
            let type_10: string;
            export { type_10 as type };
            let items_2: {};
            export { items_2 as items };
        }
        export namespace multipleOf {
            let type_11: string;
            export { type_11 as type };
            export let exclusiveMinimum: number;
        }
        export namespace maximum {
            let type_12: string;
            export { type_12 as type };
        }
        export namespace exclusiveMaximum {
            let type_13: string;
            export { type_13 as type };
        }
        export namespace minimum_1 {
            let type_14: string;
            export { type_14 as type };
        }
        export { minimum_1 as minimum };
        export namespace exclusiveMinimum_1 {
            let type_15: string;
            export { type_15 as type };
        }
        export { exclusiveMinimum_1 as exclusiveMinimum };
        export namespace maxLength {
            let $ref_2: string;
            export { $ref_2 as $ref };
        }
        export namespace minLength {
            let $ref_3: string;
            export { $ref_3 as $ref };
        }
        export namespace pattern {
            let type_16: string;
            export { type_16 as type };
            let format_3: string;
            export { format_3 as format };
        }
        export namespace additionalItems {
            let $ref_4: string;
            export { $ref_4 as $ref };
        }
        export namespace items_3 {
            export let anyOf: {
                $ref: string;
            }[];
            let _default_2: {};
            export { _default_2 as default };
        }
        export { items_3 as items };
        export namespace maxItems {
            let $ref_5: string;
            export { $ref_5 as $ref };
        }
        export namespace minItems_1 {
            let $ref_6: string;
            export { $ref_6 as $ref };
        }
        export { minItems_1 as minItems };
        export namespace uniqueItems_1 {
            let type_17: string;
            export { type_17 as type };
            let _default_3: boolean;
            export { _default_3 as default };
        }
        export { uniqueItems_1 as uniqueItems };
        export namespace contains {
            let $ref_7: string;
            export { $ref_7 as $ref };
        }
        export namespace maxProperties {
            let $ref_8: string;
            export { $ref_8 as $ref };
        }
        export namespace minProperties {
            let $ref_9: string;
            export { $ref_9 as $ref };
        }
        export namespace required {
            let $ref_10: string;
            export { $ref_10 as $ref };
        }
        export namespace additionalProperties {
            let $ref_11: string;
            export { $ref_11 as $ref };
        }
        export namespace definitions_1 {
            let type_18: string;
            export { type_18 as type };
            export namespace additionalProperties_1 {
                let $ref_12: string;
                export { $ref_12 as $ref };
            }
            export { additionalProperties_1 as additionalProperties };
            let _default_4: {};
            export { _default_4 as default };
        }
        export { definitions_1 as definitions };
        export namespace properties_1 {
            let type_19: string;
            export { type_19 as type };
            export namespace additionalProperties_2 {
                let $ref_13: string;
                export { $ref_13 as $ref };
            }
            export { additionalProperties_2 as additionalProperties };
            let _default_5: {};
            export { _default_5 as default };
        }
        export { properties_1 as properties };
        export namespace patternProperties {
            let type_20: string;
            export { type_20 as type };
            export namespace additionalProperties_3 {
                let $ref_14: string;
                export { $ref_14 as $ref };
            }
            export { additionalProperties_3 as additionalProperties };
            export namespace propertyNames {
                let format_4: string;
                export { format_4 as format };
            }
            let _default_6: {};
            export { _default_6 as default };
        }
        export namespace dependencies {
            let type_21: string;
            export { type_21 as type };
            export namespace additionalProperties_4 {
                let anyOf_1: {
                    $ref: string;
                }[];
                export { anyOf_1 as anyOf };
            }
            export { additionalProperties_4 as additionalProperties };
        }
        export namespace propertyNames_1 {
            let $ref_15: string;
            export { $ref_15 as $ref };
        }
        export { propertyNames_1 as propertyNames };
        let _const: {};
        export { _const as const };
        export namespace _enum_1 {
            let type_22: string;
            export { type_22 as type };
            let minItems_2: number;
            export { minItems_2 as minItems };
            let uniqueItems_2: boolean;
            export { uniqueItems_2 as uniqueItems };
        }
        export { _enum_1 as enum };
        export namespace type_23 {
            let anyOf_2: ({
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
            export { anyOf_2 as anyOf };
        }
        export { type_23 as type };
        export namespace format_5 {
            let type_24: string;
            export { type_24 as type };
        }
        export { format_5 as format };
        export namespace allOf_1 {
            let $ref_16: string;
            export { $ref_16 as $ref };
        }
        export { allOf_1 as allOf };
        export namespace anyOf_3 {
            let $ref_17: string;
            export { $ref_17 as $ref };
        }
        export { anyOf_3 as anyOf };
        export namespace oneOf {
            let $ref_18: string;
            export { $ref_18 as $ref };
        }
        export namespace not {
            let $ref_19: string;
            export { $ref_19 as $ref };
        }
    }
    let _default_7: {};
    export { _default_7 as default };
}
export default _default;
