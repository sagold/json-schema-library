import { JSONSchema } from "./types";
import Core from "./cores/CoreInterface";
interface TemplateOptions {
    /** Add all properties (required and optional) to the generated data */
    addOptionalProps: boolean;
}
declare const _default: (core: Core, data?: any, schema?: JSONSchema, opts?: TemplateOptions) => any;
export default _default;
