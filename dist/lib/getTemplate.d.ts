import { JSONSchema } from "./types";
import { Draft as Core } from "./draft";
export type TemplateOptions = {
    /** Add all properties (required and optional) to the generated data */
    addOptionalProps?: boolean;
    /** remove data that does not match input schema. Defaults to false */
    removeInvalidData?: boolean;
};
declare const _default: (core: Core, data?: any, schema?: JSONSchema, opts?: TemplateOptions) => any;
export default _default;
