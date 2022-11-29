import { JSONSchema } from "./types";
import { Draft as Core } from "./draft";
export declare type TemplateOptions = {
    /** Add all properties (required and optional) to the generated data */
    addOptionalProps: boolean;
    /** remove any data that does not match the given input schema */
    removeInvalidData?: boolean;
};
declare const _default: (core: Core, data?: any, schema?: JSONSchema, opts?: TemplateOptions) => any;
export default _default;
