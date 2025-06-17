declare namespace _default {
    let $schema: string;
    let $id: string;
    let $recursiveAnchor: boolean;
    let title: string;
    let type: string[];
    namespace properties {
        namespace contentMediaType {
            let type_1: string;
            export { type_1 as type };
        }
        namespace contentEncoding {
            let type_2: string;
            export { type_2 as type };
        }
        namespace contentSchema {
            let $recursiveRef: string;
        }
    }
}
export default _default;
