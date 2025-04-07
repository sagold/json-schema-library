import { Draft } from "../types";
export declare function copyDraft(draft: Draft): {
    keywords: {
        id: string;
        keyword: string;
        order?: number;
        parse?: (node: import("../types").SchemaNode) => void;
        addResolve?: (node: import("../types").SchemaNode) => boolean;
        resolve?: import("../Keyword").JsonSchemaResolver;
        addValidate?: (node: import("../types").SchemaNode) => boolean;
        validate?: import("../Keyword").JsonSchemaValidator;
        addReduce?: (node: import("../types").SchemaNode) => boolean;
        reduce?: import("../Keyword").JsonSchemaReducer;
    }[];
    $schemaRegEx: string;
    version: import("../types").DraftVersion;
    methods: {
        createSchema: typeof import("../methods/createSchema").createSchema;
        getChildSchemaSelection: typeof import("../methods/getChildSchemaSelection").getChildSchemaSelection;
        getTemplate: typeof import("../methods/getTemplate").getTemplate;
        each: typeof import("../methods/each").each;
    };
    $schema?: string;
    errors: import("../types").ErrorConfig;
    formats: typeof import("../formats/formats").formats;
};
