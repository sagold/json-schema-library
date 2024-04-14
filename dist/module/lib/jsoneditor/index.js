import merge from "../utils/merge";
import { resolveOneOfFuzzy } from "../features/oneOf";
import resolveRef from "../resolveRef";
import { Draft } from "../draft";
import { draft07Config } from "../draft07";
const draftJsonEditorConfig = {
    ...draft07Config,
    resolveOneOf: resolveOneOfFuzzy,
    resolveRef
};
class JsonEditor extends Draft {
    constructor(schema, config = {}) {
        super(merge(draftJsonEditorConfig, config), schema);
    }
}
export { JsonEditor, draftJsonEditorConfig };
