import { JsonSchema, JsonPointer, JsonError } from "./types";
import { Draft } from "./draft";
export interface OnError {
    (error: JsonError): void;
}
export type Options = {
    schema?: JsonSchema;
    pointer?: JsonPointer;
    onError?: OnError;
};
/**
 * @async
 * Validate data by a json schema
 *
 * @param draft - validator
 * @param value - value to validate
 * @param options
 * @param options.schema - json schema to use, defaults to draft.rootSchema
 * @param options.pointer - json pointer pointing to current value. Used in error reports
 * @param options.onError   - will be called for each error as soon as it is resolved
 * @return list of errors or empty
 */
export default function validateAsync(draft: Draft, value: any, options?: Options): Promise<Array<JsonError>>;
