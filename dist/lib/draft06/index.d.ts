import { DraftConfig, Draft } from "../draft";
import { JSONSchema } from "../types";
declare const draft06Config: DraftConfig;
declare class Draft06 extends Draft {
    constructor(schema?: JSONSchema, config?: Partial<DraftConfig>);
}
export { Draft06, draft06Config };
