declare namespace _default {
    let $schema: string;
    let $id: string;
    let $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/core": boolean;
        "https://json-schema.org/draft/2020-12/vocab/applicator": boolean;
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": boolean;
        "https://json-schema.org/draft/2020-12/vocab/validation": boolean;
        "https://json-schema.org/draft/2020-12/vocab/meta-data": boolean;
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": boolean;
        "https://json-schema.org/draft/2020-12/vocab/content": boolean;
    };
    let $dynamicAnchor: string;
    let title: string;
    let allOf: {
        $ref: string;
    }[];
    let type: string[];
    let $comment: string;
    namespace properties {
        namespace definitions {
            let $comment_1: string;
            export { $comment_1 as $comment };
            let type_1: string;
            export { type_1 as type };
            export namespace additionalProperties {
                let $dynamicRef: string;
            }
            export let deprecated: boolean;
            let _default: {};
            export { _default as default };
        }
        namespace dependencies {
            let $comment_2: string;
            export { $comment_2 as $comment };
            let type_2: string;
            export { type_2 as type };
            export namespace additionalProperties_1 {
                let anyOf: ({
                    $dynamicRef: string;
                    $ref?: undefined;
                } | {
                    $ref: string;
                    $dynamicRef?: undefined;
                })[];
            }
            export { additionalProperties_1 as additionalProperties };
            let deprecated_1: boolean;
            export { deprecated_1 as deprecated };
            let _default_1: {};
            export { _default_1 as default };
        }
        namespace $recursiveAnchor {
            let $comment_3: string;
            export { $comment_3 as $comment };
            export let $ref: string;
            let deprecated_2: boolean;
            export { deprecated_2 as deprecated };
        }
        namespace $recursiveRef {
            let $comment_4: string;
            export { $comment_4 as $comment };
            let $ref_1: string;
            export { $ref_1 as $ref };
            let deprecated_3: boolean;
            export { deprecated_3 as deprecated };
        }
    }
}
export default _default;
