import { DraftConfig, Draft } from "../draft";
import { JSONSchema } from "../types";
declare const draft07Config: DraftConfig;
declare class Draft07 extends Draft {
    constructor(schema?: JSONSchema, config?: Partial<DraftConfig>);
}
export { Draft07, draft07Config };
