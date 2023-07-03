import { DraftConfig, Draft } from "../draft";
import { JsonSchema } from "../types";
declare const draft07Config: DraftConfig;
declare class Draft07 extends Draft {
    constructor(schema?: JsonSchema, config?: Partial<DraftConfig>);
}
export { Draft07, draft07Config };
