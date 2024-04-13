import merge from "../utils/merge";
import { resolveOneOfFuzzy } from "../features/oneOf";
import resolveRef from "../resolveRef";
import { Draft, DraftConfig } from "../draft";
import { draft07Config } from "../draft07";
import { JsonSchema } from "../types";

const draftJsonEditorConfig: DraftConfig = {
    ...draft07Config,
    resolveOneOf: resolveOneOfFuzzy,
    resolveRef
};

class JsonEditor extends Draft {
    constructor(schema?: JsonSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draftJsonEditorConfig, config), schema);
    }
}

export { JsonEditor, draftJsonEditorConfig };
