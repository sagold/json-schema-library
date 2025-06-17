declare namespace _default {
    let $schema: string;
    let $id: string;
    let $vocabulary: {
        "https://json-schema.org/draft/2019-09/vocab/core": boolean;
        "https://json-schema.org/draft/2019-09/vocab/applicator": boolean;
        "https://json-schema.org/draft/2019-09/vocab/validation": boolean;
        "https://json-schema.org/draft/2019-09/vocab/meta-data": boolean;
        "https://json-schema.org/draft/2019-09/vocab/format": boolean;
        "https://json-schema.org/draft/2019-09/vocab/content": boolean;
    };
    let $recursiveAnchor: boolean;
    let title: string;
    let allOf: {
        $ref: string;
    }[];
    let type: string[];
    namespace properties {
        namespace definitions {
            export let $comment: string;
            let type_1: string;
            export { type_1 as type };
            export namespace additionalProperties {
                let $recursiveRef: string;
            }
            let _default: {};
            export { _default as default };
        }
        namespace dependencies {
            let $comment_1: string;
            export { $comment_1 as $comment };
            let type_2: string;
            export { type_2 as type };
            export namespace additionalProperties_1 {
                let anyOf: ({
                    $recursiveRef: string;
                    $ref?: undefined;
                } | {
                    $ref: string;
                    $recursiveRef?: undefined;
                })[];
            }
            export { additionalProperties_1 as additionalProperties };
        }
    }
}
export default _default;
