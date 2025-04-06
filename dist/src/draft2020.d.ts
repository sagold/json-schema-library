/**
 * @draft-2020-12 https://json-schema.org/draft/2020-12/release-notes
 *
 * - The items and additionalItems keywords have been replaced with prefixItems and items
 * - Although the meaning of items has changed, the syntax for defining arrays remains the same.
 *  Only the syntax for defining tuples has changed. The idea is that an array has items (items)
 *  and optionally has some positionally defined items that come before the normal items (prefixItems).
 * - The $recursiveRef and $recursiveAnchor keywords were replaced by the more powerful $dynamicRef and
 *  $dynamicAnchor keywords
 * - This draft specifies that any item in an array that passes validation of the contains schema is
 *  considered "evaluated".
 * - Regular expressions are now expected (but not strictly required) to support unicode characters.
 * - This draft drops support for the schema media type parameter
 * - If you reference an external schema, that schema can declare its own $schema and that may be different
 *  than the $schema of the referencing schema. Implementations need to be prepared to switch processing
 *  modes or throw an error if they don't support the $schema of the referenced schema
 * - Implementations that collect annotations should now include annotations for unknown keywords in the
 *  "verbose" output format.
 * - The format vocabulary was broken into two separate vocabularies. The "format-annotation" vocabulary
 *  treats the format keyword as an annotation and the "format-assertion" vocabulary treats the format
 *  keyword as an assertion. The "format-annotation" vocabulary is used in the default meta-schema and
 *  is required.
 *
 */
export declare const draft2020: import("./types").Draft;
