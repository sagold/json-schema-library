import merge from "../utils/merge";
import resolveOneOf from "../resolveOneOf.fuzzy";
import resolveRef from "../resolveRef.merge";
import { Draft } from "../draft";
import { draft04Config } from "../draft04";
const draftJsonEditorConfig = {
    ...draft04Config,
    resolveOneOf,
    resolveRef
};
class JsonEditor extends Draft {
    constructor(schema, config = {}) {
        super(merge(draftJsonEditorConfig, config), schema);
    }
}
export { JsonEditor, draftJsonEditorConfig };
