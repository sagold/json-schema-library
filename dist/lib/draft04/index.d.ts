import { DraftConfig, Draft } from "../draft";
import { JSONSchema } from "../types";
declare const draft04Config: DraftConfig;
declare class Draft04 extends Draft {
    constructor(schema?: JSONSchema, config?: Partial<DraftConfig>);
}
export { Draft04, draft04Config };
