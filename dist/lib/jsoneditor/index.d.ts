import { Draft, DraftConfig } from "../draft";
import { JSONSchema } from "../types";
declare const draftJsonEditorConfig: DraftConfig;
declare class JsonEditor extends Draft {
    constructor(schema?: JSONSchema, config?: Partial<DraftConfig>);
}
export { JsonEditor, draftJsonEditorConfig };
