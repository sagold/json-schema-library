import { DraftConfig, Draft } from "../draft";
import { JsonSchema } from "../types";
declare const draft2019Config: DraftConfig;
declare class Draft2019 extends Draft {
    constructor(schema?: JsonSchema, config?: Partial<DraftConfig>);
}
export { Draft2019, draft2019Config };
