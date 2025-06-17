import { Draft } from "../types.js";
export declare function copyDraft(draft: Draft): {
    keywords: any[];
    $schemaRegEx: string;
    version: import("../Draft.js").DraftVersion;
    methods: {
        createSchema: typeof import("../methods/createSchema.js").createSchema;
        getChildSelection: typeof import("../methods/getChildSelection.js").getChildSelection;
        getData: typeof import("../methods/getData.js").getData;
        toDataNodes: typeof import("../methods/toDataNodes.js").toDataNodes;
    };
    $schema?: string;
    errors: import("../types.js").ErrorConfig;
    formats: Record<string, import("../Keyword.js").JsonSchemaValidator>;
};
