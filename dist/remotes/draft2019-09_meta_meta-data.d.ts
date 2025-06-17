declare namespace _default {
    let $schema: string;
    let $id: string;
    let $recursiveAnchor: boolean;
    let title: string;
    let type: string[];
    namespace properties {
        export namespace title_1 {
            let type_1: string;
            export { type_1 as type };
        }
        export { title_1 as title };
        export namespace description {
            let type_2: string;
            export { type_2 as type };
        }
        let _default: boolean;
        export { _default as default };
        export namespace deprecated {
            let type_3: string;
            export { type_3 as type };
            let _default_1: boolean;
            export { _default_1 as default };
        }
        export namespace readOnly {
            let type_4: string;
            export { type_4 as type };
            let _default_2: boolean;
            export { _default_2 as default };
        }
        export namespace writeOnly {
            let type_5: string;
            export { type_5 as type };
            let _default_3: boolean;
            export { _default_3 as default };
        }
        export namespace examples {
            let type_6: string;
            export { type_6 as type };
            export let items: boolean;
        }
    }
}
export default _default;
