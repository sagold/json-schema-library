import merge from "../utils/merge";
import resolveOneOf from "../resolveOneOf.fuzzy";
import resolveRef from "../resolveRef.merge";
import { Draft, DraftConfig } from "../draft";
import { draft07Config } from "../draft07";
import { JSONSchema } from "../types";

const draftJsonEditorConfig: DraftConfig = {
    ...draft07Config,
    resolveOneOf,
    resolveRef
};

class JsonEditor extends Draft {
    constructor(schema?: JSONSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draftJsonEditorConfig, config), schema);
    }
}

export { JsonEditor, draftJsonEditorConfig };
