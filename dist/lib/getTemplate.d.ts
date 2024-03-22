import { JsonSchema } from "./types";
import { Draft } from "./draft";
export type TemplateOptions = {
    /** Add all properties (required and optional) to the generated data */
    addOptionalProps?: boolean;
    /** Remove data that does not match input schema. Defaults to false */
    removeInvalidData?: boolean;
    /** Set to false to take default values as they are and not extend them.
     *  Defaults to true.
     *  This allows to control template data e.g. enforcing arrays to be empty,
     *  regardless of minItems settings.
     */
    extendDefaults?: boolean;
};
declare const _default: (draft: Draft, data?: any, schema?: JsonSchema, opts?: TemplateOptions) => any;
export default _default;
