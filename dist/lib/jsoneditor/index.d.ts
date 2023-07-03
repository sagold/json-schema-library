import { Draft, DraftConfig } from "../draft";
import { JsonSchema } from "../types";
declare const draftJsonEditorConfig: DraftConfig;
declare class JsonEditor extends Draft {
    constructor(schema?: JsonSchema, config?: Partial<DraftConfig>);
}
export { JsonEditor, draftJsonEditorConfig };
