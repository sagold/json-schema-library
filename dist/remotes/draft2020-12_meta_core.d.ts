declare namespace _default {
    export let $schema: string;
    export let $id: string;
    export let $dynamicAnchor: string;
    export let title: string;
    export let type: string[];
    export namespace properties {
        export namespace $id_1 {
            let $ref: string;
            let $comment: string;
            let pattern: string;
        }
        export { $id_1 as $id };
        export namespace $schema_1 {
            let $ref_1: string;
            export { $ref_1 as $ref };
        }
        export { $schema_1 as $schema };
        export namespace $ref_2 {
            let $ref_3: string;
            export { $ref_3 as $ref };
        }
        export { $ref_2 as $ref };
        export namespace $anchor {
            let $ref_4: string;
            export { $ref_4 as $ref };
        }
        export namespace $dynamicRef {
            let $ref_5: string;
            export { $ref_5 as $ref };
        }
        export namespace $dynamicAnchor_1 {
            let $ref_6: string;
            export { $ref_6 as $ref };
        }
        export { $dynamicAnchor_1 as $dynamicAnchor };
        export namespace $vocabulary {
            let type_1: string;
            export { type_1 as type };
            export namespace propertyNames {
                let $ref_7: string;
                export { $ref_7 as $ref };
            }
            export namespace additionalProperties {
                let type_2: string;
                export { type_2 as type };
            }
        }
        export namespace $comment_1 {
            let type_3: string;
            export { type_3 as type };
        }
        export { $comment_1 as $comment };
        export namespace $defs {
            let type_4: string;
            export { type_4 as type };
            export namespace additionalProperties_1 {
                let $dynamicRef_1: string;
                export { $dynamicRef_1 as $dynamicRef };
            }
            export { additionalProperties_1 as additionalProperties };
        }
    }
    export namespace $defs_1 {
        namespace anchorString {
            let type_5: string;
            export { type_5 as type };
            let pattern_1: string;
            export { pattern_1 as pattern };
        }
        namespace uriString {
            let type_6: string;
            export { type_6 as type };
            export let format: string;
        }
        namespace uriReferenceString {
            let type_7: string;
            export { type_7 as type };
            let format_1: string;
            export { format_1 as format };
        }
    }
    export { $defs_1 as $defs };
}
export default _default;
