import merge from "../utils/merge";
import resolveOneOf from "../resolveOneOf.fuzzy";
import resolveRef from "../resolveRef.merge";
import { Draft, DraftConfig } from "../draft";
import { draft04Config } from "../draft04";
import { JSONSchema } from "../types";

const draftJsonEditorConfig: DraftConfig = {
    ...draft04Config,
    resolveOneOf,
    resolveRef
};

class JsonEditor extends Draft {
    constructor(schema?: JSONSchema, config: Partial<DraftConfig> = {}) {
        super(merge(draftJsonEditorConfig, config), schema);
    }
}

export { JsonEditor, draftJsonEditorConfig };
