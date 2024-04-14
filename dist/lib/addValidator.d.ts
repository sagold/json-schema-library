import { Draft } from "./draft";
import { JsonValidator } from "./validation/type";
import { CreateError } from "./utils/createCustomError";
/**
 * @throws Error
 * Adds a custom error. May override existing errors
 *
 * @param draft
 * @param errorId id of error @see /lib/validation/errors
 * @param errorCreator - function returning an error-object @see /lib/utils/createCustomError
 */
declare function addError(draft: Draft, errorId: string, errorCreator: CreateError): void;
/**
 * Adds a custom format validator. Existing format may not be overriden (may still be modified manually)
 * @param draft
 * @param formatType - format type (i.e. `format: "html"`)
 * @param validationFunction - called with (draft, schema, value, pointer)
 */
declare function addFormat(draft: Draft, formatType: string, validationFunction: JsonValidator): void;
/**
 * Adds a custom keyword validation to a specific type. May not override existing keywords.
 *
 * @param draft
 * @param datatype - valid datatype like "object", "array", "string", etc
 * @param keyword - The keyword to add, i.e. `minWidth: ...`
 * @param validationFunction - called with (draft, schema, value, pointer)
 */
declare function addKeyword(draft: Draft, datatype: string, keyword: string, validationFunction: JsonValidator): void;
declare const _default: {
    error: typeof addError;
    format: typeof addFormat;
    keyword: typeof addKeyword;
};
export default _default;
