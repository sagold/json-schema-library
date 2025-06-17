declare namespace _default {
    let $schema: string;
    let $id: string;
    let $recursiveAnchor: boolean;
    let title: string;
    let type: string[];
    namespace properties {
        export namespace $id_1 {
            let type_1: string;
            export { type_1 as type };
            export let format: string;
            export let $comment: string;
            export let pattern: string;
        }
        export { $id_1 as $id };
        export namespace $schema_1 {
            let type_2: string;
            export { type_2 as type };
            let format_1: string;
            export { format_1 as format };
        }
        export { $schema_1 as $schema };
        export namespace $anchor {
            let type_3: string;
            export { type_3 as type };
            let pattern_1: string;
            export { pattern_1 as pattern };
        }
        export namespace $ref {
            let type_4: string;
            export { type_4 as type };
            let format_2: string;
            export { format_2 as format };
        }
        export namespace $recursiveRef {
            let type_5: string;
            export { type_5 as type };
            let format_3: string;
            export { format_3 as format };
        }
        export namespace $recursiveAnchor_1 {
            let type_6: string;
            export { type_6 as type };
            let _default: boolean;
            export { _default as default };
        }
        export { $recursiveAnchor_1 as $recursiveAnchor };
        export namespace $vocabulary {
            let type_7: string;
            export { type_7 as type };
            export namespace propertyNames {
                let type_8: string;
                export { type_8 as type };
                let format_4: string;
                export { format_4 as format };
            }
            export namespace additionalProperties {
                let type_9: string;
                export { type_9 as type };
            }
        }
        export namespace $comment_1 {
            let type_10: string;
            export { type_10 as type };
        }
        export { $comment_1 as $comment };
        export namespace $defs {
            let type_11: string;
            export { type_11 as type };
            export namespace additionalProperties_1 {
                let $recursiveRef_1: string;
                export { $recursiveRef_1 as $recursiveRef };
            }
            export { additionalProperties_1 as additionalProperties };
            let _default_1: {};
            export { _default_1 as default };
        }
    }
}
export default _default;
