import { Draft } from "../types";
export declare function copyDraft(draft: Draft): {
    keywords: {
        id: string;
        keyword: string;
        order?: number;
        parse?: (node: import("../SchemaNode").SchemaNode) => void;
        addResolve?: (node: import("../SchemaNode").SchemaNode) => boolean;
        resolve?: import("../Keyword").JsonSchemaResolver;
        addValidate?: (node: import("../SchemaNode").SchemaNode) => boolean;
        validate?: import("../Keyword").JsonSchemaValidator;
        addReduce?: (node: import("../SchemaNode").SchemaNode) => boolean;
        reduce?: import("../Keyword").JsonSchemaReducer;
    }[];
    $schemaRegEx: string;
    version: import("../Draft").DraftVersion;
    methods: {
        createSchema: typeof import("../methods/createSchema").createSchema;
        getChildSchemaSelection: typeof import("../methods/getChildSchemaSelection").getChildSchemaSelection;
        getTemplate: typeof import("../methods/getTemplate").getTemplate;
        toDataNodes: typeof import("../methods/toDataNodes").toDataNodes;
    };
    $schema?: string;
    errors: import("../types").ErrorConfig;
    formats: typeof import("../formats/formats").formats;
};
