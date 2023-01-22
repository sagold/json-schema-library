import { DraftConfig, Draft } from "../draft";
import { JsonSchema } from "../types";
declare const draft06Config: DraftConfig;
declare class Draft06 extends Draft {
    constructor(schema?: JsonSchema, config?: Partial<DraftConfig>);
}
export { Draft06, draft06Config };
