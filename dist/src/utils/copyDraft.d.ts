import { Draft } from "../types";
export declare function copyDraft(draft: Draft): {
    keywords: {
        id: string;
        keyword: string;
        parse?: (node: import("../types").SchemaNode) => void;
        addResolve?: (node: import("../types").SchemaNode) => boolean;
        resolve?: import("../Keyword").JsonSchemaResolver;
        addValidate?: (node: import("../types").SchemaNode) => boolean;
        validate?: import("../Keyword").JsonSchemaValidator;
        addReduce?: (node: import("../types").SchemaNode) => boolean;
        reduce?: import("../Keyword").JsonSchemaReducer;
    }[];
    errors: typeof import("../errors/errors").errors;
    methods: {
        createSchema: typeof import("../..").createSchema;
        getChildSchemaSelection: typeof import("../methods/getChildSchemaSelection").getChildSchemaSelection;
        getTemplate: typeof import("../methods/getTemplate").getTemplate;
        each: typeof import("../methods/each").each;
    };
    version: import("../types").DraftVersion;
    $schema?: string;
    $schemaRegEx: string;
};
