import { JsonSchema } from "./types";
import { Draft } from "./draft";
export type TemplateOptions = {
    /** Add all properties (required and optional) to the generated data */
    addOptionalProps?: boolean;
    /** remove data that does not match input schema. Defaults to false */
    removeInvalidData?: boolean;
};
declare const _default: (draft: Draft, data?: any, schema?: JsonSchema, opts?: TemplateOptions) => any;
export default _default;
