import { SchemaNode } from "../types";
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
    /**
     * Limits how often a $ref should be followed before aborting. Prevents infinite data-structure.
     * Defaults to 1
     */
    recursionLimit?: number;
    /** @internal disables recursion limit for next call */
    disableRecusionLimit?: boolean;
    /** @internal context to track recursion limit */
    cache?: Record<string, Record<string, number>>;
};
export declare function getTemplate(node: SchemaNode, data?: unknown, opts?: TemplateOptions): any;
