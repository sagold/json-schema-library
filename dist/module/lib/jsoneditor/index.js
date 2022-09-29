import merge from "../utils/merge";
import resolveOneOf from "../resolveOneOf.fuzzy";
import resolveRef from "../resolveRef.merge";
import { Draft } from "../draft";
import { draft07Config } from "../draft07";
const draftJsonEditorConfig = {
    ...draft07Config,
    resolveOneOf,
    resolveRef
};
class JsonEditor extends Draft {
    constructor(schema, config = {}) {
        super(merge(draftJsonEditorConfig, config), schema);
    }
}
export { JsonEditor, draftJsonEditorConfig };
