import { Draft as Core } from "./draft";
import { JSONValidator } from "./types";
import { CreateError } from "./utils/createCustomError";
/**
 * @throws Error
 * Adds a custom error. May override existing errors
 *
 * @param core
 * @param errorId id of error @see /lib/validation/errors
 * @param errorCreator - function returning an error-object @see /lib/utils/createCustomError
 */
declare function addError(core: Core, errorId: string, errorCreator: CreateError): void;
/**
 * Adds a custom format validator. Existing format may not be overriden (may still be modified manually)
 * @param core
 * @param formatType - format type (i.e. `format: "html"`)
 * @param validationFunction - called with (core, schema, value, pointer)
 */
declare function addFormat(core: Core, formatType: string, validationFunction: JSONValidator): void;
/**
 * Adds a custom keyword validation to a specific type. May not override existing keywords.
 *
 * @param core
 * @param datatype - valid datatype like "object", "array", "string", etc
 * @param keyword - The keyword to add, i.e. `minWidth: ...`
 * @param validationFunction - called with (core, schema, value, pointer)
 */
declare function addKeyword(core: Core, datatype: string, keyword: string, validationFunction: JSONValidator): void;
declare const _default: {
    error: typeof addError;
    format: typeof addFormat;
    keyword: typeof addKeyword;
};
export default _default;
