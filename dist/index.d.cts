import { A as JsonSchemaResolver, C as DraftVersion, D as DataNode, E as TemplateOptions, F as Maybe, I as ValidationAnnotation, L as ValidationPath, M as JsonSchemaValidator, N as JsonSchemaValidatorParams, O as JsonSchemaReducer, P as Keyword, R as ValidationReturnType, S as Draft, T as extendDraft, _ as GetNodeOptions, a as JsonAnnotation, b as isReduceable, c as JsonSchema, d as isAnnotation, f as isBooleanSchema, g as Context, h as isJsonSchema, i as ErrorConfig, j as JsonSchemaResolverParams, k as JsonSchemaReducerParams, l as NodeOrError, m as isJsonError, n as AnnotationData, o as JsonError, p as isJsonAnnotation, r as BooleanSchema, s as JsonPointer, t as Annotation, u as OptionalNodeOrError, v as SchemaNode, w as addKeywords, x as isSchemaNode, y as ValidateReturnType } from "./types-ZgoQMSny.cjs";

//#region src/compileSchema.d.ts
type CompileOptions = {
  /**
   * List of drafts to support.
   *
   * Drafts are selected by testing the passed `schema.$schema` for a matching id, which
   * is tested by each draft's `Draft.$schemaRegEx`. In case no draft matches `schema.$schema`
   * the last draft in the list will be used.
   *
   * @default [draft04, draft06, draft07, draft2019, draft2020]
   *
   * @example
   * import { draft04, draft07, draft2020 } from "json-schema-library"
   * compileSchema({ $schema: "draft-04" }, { drafts: [draft04, draft07, draft2020] })
   */
  drafts?: Draft[];
  /**
   * Fallback _draft_ version in case no _draft_ is specified by `schema.$schema`.
   *
   * Drafts are selected by given `schema.$schema` or the last draft from `drafts` as a fallback.
   * Specifying `draft` will workthe same as a specifying `schema.$schema` in case no $schema is
   * defined. When no match can be found, the last _draft_ from `drafts` will be used.
   *
   * @example
   * // uses draft-04
   * compileSchema({ $schema: "draft-04" }, { drafts: [draft04, draft07, draft2020] })
   *
   * // uses draft-2020-12
   * compileSchema({}, { drafts: [draft04, draft07, draft2020] })
   *
   * // uses draft-07
   * compileSchema({}, { draft: "draft-07", drafts: [draft04, draft07, draft2020] })
    * // uses draft-04
   * compileSchema({ $schema: "draft-04" }, { draft: "draft-07", drafts: [draft04, draft07, draft2020] })
   *
   * // uses draft-2020
   * compileSchema({ $schema: "draft-04" }, { draft: "draft-07", drafts: [draft2020] })
   */
  draft?: string;
  /**
   * Set node and its remote schemata as remote schemata for this node and schema to resolve $ref
   */
  remote?: SchemaNode;
  /**
   * Enables `format`-keyword assertions when this is set tor `true` or sets assertion as defined by
   * the given meta-schema. Set to `false` to deactivate format validation.
   *
   * @default true
   */
  formatAssertion?: boolean | "meta-schema" | undefined; /** Set default options for all `node.getData` requests */
  getDataDefaultOptions?: TemplateOptions; /** Set to true to throw an Error on errors in input schema. Defaults to false */
  throwOnInvalidSchema?: boolean; /** Set to true to collect unknown keywords of input schema in `node.schemaAnnotations`. Defaults to false */
  withSchemaAnnotations?: boolean; /** Set to true to throw an Error when encountering an unresolvable ref  */
  throwOnInvalidRef?: boolean;
};
/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation as possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
declare function compileSchema(schema: JsonSchema | BooleanSchema, options?: CompileOptions): SchemaNode & {
  schemaErrors?: JsonError[];
  schemaAnnotations: JsonAnnotation[];
};
//#endregion
//#region src/settings.d.ts
declare const _default: {
  DECLARATOR_ONEOF: string;
  propertyBlacklist: string[];
  DYNAMIC_PROPERTIES: string[];
  REGEX_FLAGS: string;
  /**
   * properties to keep from a $ref-schema when resolving a $ref (recursively)
   * this allows to overwrite specified properties locally on a $ref-definition
   *
   * - draft 2019-09
   * - draft 2020-12
   *
   * @example
   * {
   *   title: "custom component",
   *   $ref: "#/$defs/component",
   *
   *   $defs: {
   *     component: {
   *       title: "component",
   *       type: "object"
   *     }
   *   }
   * }
   * // results in
   * {
   *   title: "custom component"
   *   type: "object"
   * }
   */
  PROPERTIES_TO_MERGE: string[];
};
//#endregion
//#region src/draft04.d.ts
/**
 * @draft-04
 *
 * remove from draft06
 * - booleans as schemas allowable anywhere, not just "additionalProperties" and "additionalItems"
 * - propertyNames
 * - contains
 * - const
 * - format: uri-reference
 * - format: uri-template
 * - format: json-pointer
 * - examples: array of examples with no validation effect; the value of "default" is usable as an example without repeating it under this keyword
 *
 * revert from draft06
 * - $id replaces id
 * - $ref only allowed where a schema is expected
 * - "exclusiveMinimum" and exclusiveMaximum changed from a boolean to a number to be consistent with the principle of keyword independence
 * - type integer any number with a zero fractional part; 1.0 is now a valid "integer"  type in draft-06 and later
 * - required  allows an empty array
 * - dependencies allows an empty array for property dependencies
 */
declare const draft04: Draft;
//#endregion
//#region src/draft06.d.ts
/**
 * @draft-06 https://json-schema.org/draft-06/json-schema-release-notes
 *
 * new
 * - booleans as schemas allowable anywhere, not just "additionalProperties" and "additionalItems"
 * - propertyNames
 * - contains
 * - const
 * - format: uri-reference
 * - format: uri-template
 * - format: json-pointer
 * - examples: array of examples with no validation effect; the value of "default" is usable as an example without repeating it under this keyword
 *
 * changes
 * - $id replaces id
 * - $ref only allowed where a schema is expected
 * - "exclusiveMinimum" and exclusiveMaximum changed from a boolean to a number to be consistent with the principle of keyword independence
 * - type integer any number with a zero fractional part; 1.0 is now a valid "integer"  type in draft-06 and later
 * - required  allows an empty array
 * - dependencies allows an empty array for property dependencies
 */
declare const draft06: Draft;
//#endregion
//#region src/draft07.d.ts
/**
 * @draft-07 https://json-schema.org/draft-07/json-schema-release-notes
 *
 * new
 * - "$comment"
 * - "if", "then", "else"
 * - "readOnly"
 * - "writeOnly"
 * - "contentMediaType"
 * - "contentEncoding"
 */
declare const draft07: Draft;
//#endregion
//#region src/draft2019.d.ts
/**
 * @draft-2019 https://json-schema.org/draft/2019-09/release-notes
 *
 * new
 * - $anchor
 * - $recursiveAnchor and $recursiveRef
 * - $vocabulary
 *
 * changed
 * - $defs (renamed from definitions)
 * - $id
 * - $ref
 * - dependencies has been split into dependentSchemas and dependentRequired
 */
declare const draft2019: Draft;
//#endregion
//#region src/draft2020.d.ts
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
declare const draft2020: Draft;
//#endregion
//#region src/draftEditor.d.ts
/**
 * @draft-editor https://json-schema.org/draft/2020-12/release-notes
 *
 * Uses Draft 2020-12 and changes resolveOneOf to be fuzzy
 */
declare const draftEditor: Draft;
//#endregion
//#region src/keywords/oneOf.d.ts
declare const oneOfKeyword: Keyword;
declare const oneOfFuzzyKeyword: Keyword;
//#endregion
//#region src/keywords/propertyDependencies.d.ts
/**
 * @experimental `propertyDependencies` to resolve schema by nested name and value
 * @reference https://docs.google.com/presentation/d/1ajXlCQcsjjiMLsluFIILR7sN5aDRBnfqQ9DLbcFbqjI/mobilepresent?slide=id.p
 *
 * - matching schemas are resolved and validiated
 * - multiple matching schemas are resolved and validiated
 * - ignores keyword if no schema is matched
 *
 * @example
 * {
 *   type: "object",
 *   propertyDependencies: {
 *      propertyName: {
 *          propertyValue: { $ref: "#/$defs/schema" }
 *      }
 *   }
 * }
 *
 * matches
 *
 * {
 *   "propertyName": "propertyValue",
 *   "otherData": 123
 * } with "#/$defs/schema"
 */
declare const propertyDependenciesKeyword: Keyword;
//#endregion
//#region src/errors/render.d.ts
declare function render(template: string, data?: Record<string, unknown>): string;
//#endregion
//#region src/utils/getTypeOf.d.ts
type JSType = "array" | "bigint" | "boolean" | "function" | "null" | "number" | "object" | "string" | "symbol" | "undefined";
declare function getTypeOf(value: unknown): JSType;
//#endregion
//#region src/mergeNode.d.ts
declare function mergeNode(a?: SchemaNode, b?: SchemaNode, ...omit: string[]): SchemaNode | undefined;
//#endregion
//#region src/utils/mergeSchema.d.ts
declare function mergeSchema<T extends JsonSchema>(a: T, b: T, ...omit: string[]): T;
//#endregion
//#region src/utils/getSchemaType.d.ts
declare const SCHEMA_TYPES: readonly ["string", "number", "integer", "boolean", "null", "array", "object"];
type SchemaType = (typeof SCHEMA_TYPES)[number];
/**
 * @helper for getData
 * returns schema type, which might be an educated guess based on defined schema
 * properties if an exact type cannot be retried from type.
 */
declare function getSchemaType(node: SchemaNode, data: unknown): SchemaType | undefined;
//#endregion
//#region src/utils/sanitizeErrors.d.ts
/**
 * Flattens nested validation array results and filters items to only include errors, annotations and promises
 */
declare function sanitizeErrors(list: ValidationReturnType | ValidationReturnType[] | ValidationAnnotation[], result?: ValidationAnnotation[]): ValidationAnnotation[];
//#endregion
export { type Annotation, type AnnotationData, type BooleanSchema, type CompileOptions, type Context, type DataNode, type Draft, type DraftVersion, type ErrorConfig, type GetNodeOptions, type JsonAnnotation, type JsonError, type JsonPointer, type JsonSchema, type JsonSchemaReducer, type JsonSchemaReducerParams, type JsonSchemaResolver, type JsonSchemaResolverParams, type JsonSchemaValidator, type JsonSchemaValidatorParams, type Keyword, type Maybe, type NodeOrError, type OptionalNodeOrError, type SchemaNode, type ValidateReturnType, type ValidationAnnotation, type ValidationPath, type ValidationReturnType, addKeywords, compileSchema, draft04, draft06, draft07, draft2019, draft2020, draftEditor, extendDraft, getSchemaType, getTypeOf, isAnnotation, isBooleanSchema, isJsonAnnotation, isJsonError, isJsonSchema, isReduceable, isSchemaNode, mergeNode, mergeSchema, oneOfFuzzyKeyword, oneOfKeyword, propertyDependenciesKeyword, render, sanitizeErrors, _default as settings };
//# sourceMappingURL=index.d.cts.map