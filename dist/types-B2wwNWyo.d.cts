//#region src/Keyword.d.ts
type ValidationPath = {
  pointer: string;
  node: SchemaNode;
}[];
type JsonSchemaReducerParams = {
  /** data of current node */data: unknown; /** optional key to used to resolve by property without having data */
  key: string | number; /** node to reduce */
  node: SchemaNode; /** JSON pointer to data */
  pointer: string; /** passed through path for schema resolution, will be changed by reference */
  path: ValidationPath;
};
interface JsonSchemaReducer {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaReducerParams): SchemaNode | JsonError | undefined;
}
type JsonSchemaResolverParams = {
  key: string | number;
  data: unknown;
  node: SchemaNode;
};
interface JsonSchemaResolver {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaResolverParams): SchemaNode | JsonError | undefined;
}
type Maybe<T> = T | undefined;
type ValidationAnnotation = JsonError | JsonAnnotation | Promise<Maybe<ValidationAnnotation>[]>;
type ValidationResult = Maybe<ValidationAnnotation>;
type ValidationReturnType = ValidationResult | ValidationResult[];
type SchemaNodeWithRequired<K extends keyof SchemaNode> = SchemaNode & Required<Pick<SchemaNode, K>>;
type JsonSchemaValidatorParams<Key extends keyof SchemaNode = keyof SchemaNode> = {
  pointer: string;
  data: unknown;
  node: SchemaNodeWithRequired<Key>;
  path: ValidationPath;
};
interface JsonSchemaValidator<Key extends keyof SchemaNode = keyof SchemaNode> {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaValidatorParams<Key>): ValidationReturnType;
}
type Keyword<Key extends keyof SchemaNode = keyof SchemaNode> = {
  id: string; /** unique keyword corresponding to JSON Schema keywords (or custom) */
  keyword: string; /** sort order of keyword. Lower numbers will be processed last. Default is 0 */
  order?: number;
  /**
   * Called once for each JSON Schema dduring compileSchema to evaluate keyword.
   * Use this to skip or preprocess the Keyword for the given JSON Schema and
   * to create any schema annotations, like input errors.
   *
   * - most keywords cache their evaluation directly on node, e.g. node.required
   * - most keywords skip any other actions if their evaluation is missing on node
   * - return any errors found in JSON schema related to this keyword
   *      (this includes errors from created nodes)
   */
  parse?: (node: SchemaNode) => ValidationAnnotation | ValidationAnnotation[] | void;
  addResolve?: (node: SchemaNode) => boolean;
  /**
   * If this contains child-data, resolve must return schema associated for the passed in key
   *
   * @example
   * a keyword properties has has child-properties. So when a properties[key] exists,
   * it will return the node of properties[key] or nothing at all
   */
  resolve?: JsonSchemaResolver; /** return true if the given node should run the validate-function on this keyword */
  addValidate?: (node: SchemaNode) => boolean;
  /**
   * Perform validation for this keyword and the passed in data
   */
  validate?: JsonSchemaValidator<Key>;
  addReduce?: (node: SchemaNode) => boolean;
  /**
   * Remove dynamic schema-keywords by merging valid sub-schemas
   */
  reduce?: JsonSchemaReducer;
};
//#endregion
//#region src/methods/createSchema.d.ts
/**
 * Create a simple json schema for the given input data
 * @param  data - data to get json schema for
 */
declare function createSchema(data: unknown): JsonSchema;
//#endregion
//#region src/methods/toDataNodes.d.ts
type DataNode = {
  node: SchemaNode;
  value: unknown;
  pointer: string;
};
declare function toDataNodes(node: SchemaNode, data: unknown, pointer?: string, dataNodes?: DataNode[]): DataNode[];
//#endregion
//#region src/methods/getChildSelection.d.ts
/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
declare function getChildSelection(node: SchemaNode, property: string | number): JsonError | SchemaNode[];
//#endregion
//#region src/methods/getData.d.ts
type TemplateOptions = {
  /** Add all properties (required and optional) to the generated data */addOptionalProps?: boolean; /** Remove data that does not match input schema. Defaults to false */
  removeInvalidData?: boolean;
  /** Set to false to take default values as they are and not extend them.
   *  Defaults to true.
   *  This allows to control template data e.g. enforcing arrays to be empty,
   *  regardless of minItems settings.
   */
  extendDefaults?: boolean;
  /**
   * Set to false to not use type specific initial values.Defaults to true
   */
  useTypeDefaults?: boolean;
  /**
   * Limits how often a $ref should be followed before aborting. Prevents infinite data-structure.
   * Defaults to 1
   */
  recursionLimit?: number; /** @internal disables recursion limit for next call */
  disableRecursionLimit?: boolean; /** @internal context to track recursion limit */
  cache?: Record<string, Record<string, number>>;
};
declare function getData(node: SchemaNode, data?: unknown, opts?: TemplateOptions): any;
//#endregion
//#region src/Draft.d.ts
type DraftVersion = "draft-04" | "draft-06" | "draft-07" | "draft-2019-09" | "draft-2020-12" | "latest";
interface Draft {
  /** test-string if draft can be used with $schema-url */
  $schemaRegEx: string;
  /** draft-version of this draft, e.g. draft-2020-12 */
  version: DraftVersion;
  /** supported keywords and implementation */
  keywords: Keyword[];
  /** draft-dependent methods */
  methods: {
    createSchema: typeof createSchema;
    getChildSelection: typeof getChildSelection;
    getData: typeof getData;
    toDataNodes: typeof toDataNodes;
  };
  /** meta-schema url associated with this draft */
  $schema?: string;
  /** draft errors (this can still be global) */
  errors: ErrorConfig;
  formats: Record<string, JsonSchemaValidator>;
}
type PartialDraft = Partial<Omit<Draft, "errors" | "formats">> & {
  errors?: Partial<Draft["errors"]>;
  formats?: Partial<Draft["formats"]>;
};
declare function extendDraft(draft: Draft, extension: PartialDraft): Draft;
declare function addKeywords(draft: Draft, ...keywords: Keyword[]): Draft;
//#endregion
//#region src/errors/errors.d.ts
declare const errors: {
  "additional-items-error": string;
  "additional-properties-error": string;
  "all-of-error": string;
  "any-of-error": string;
  "const-error": string;
  "contains-any-error": string;
  "contains-array-error": string;
  "contains-error": string;
  "contains-min-error": string;
  "contains-max-error": string;
  "enum-error": string;
  "exclusive-maximum-error": string;
  "exclusive-minimum-error": string;
  "forbidden-property-error": string;
  "format-date-error": string;
  "format-date-time-error": string;
  "format-duration-error": string;
  "format-email-error": string;
  "format-hostname-error": string;
  "format-idn-hostname-error": string;
  "format-ipv4-error": string;
  "format-ipv4-leading-zero-error": string;
  "format-ipv6-error": string;
  "format-ipv6-leading-zero-error": string;
  "format-iri-error": string;
  "format-iri-reference-error": string;
  "format-json-pointer-error": string;
  "format-regex-error": string;
  "format-time-error": string;
  "format-uri-error": string;
  "format-uri-reference-error": string;
  "format-uri-template-error": string;
  "format-url-error": string;
  "format-uuid-error": string;
  "invalid-data-error": string;
  "invalid-property-name-error": string;
  "maximum-error": string;
  "max-items-error": string;
  "max-length-error": string;
  "max-properties-error": string;
  "minimum-error": string;
  "min-items-error": string;
  "min-items-one-error": string;
  "min-length-error": string;
  "min-length-one-error": string;
  "missing-one-of-declarator-error": string;
  "min-properties-error": string;
  "missing-array-item-error": string;
  "missing-dependency-error": string;
  "missing-one-of-property-error": string;
  "multiple-of-error": string;
  "multiple-one-of-error": string;
  "no-additional-properties-error": string;
  "not-error": string;
  "one-of-error": string;
  "one-of-property-error": string;
  "pattern-error": string;
  "pattern-properties-error": string;
  "ref-error": string;
  "required-property-error": string; /** return schema-warning with createSchemaWarning:true when a valid, but undefined  property was found */
  "schema-warning": string;
  "type-error": string;
  "undefined-value-error": string;
  "unevaluated-property-error": string;
  "unevaluated-items-error": string;
  "unique-items-error": string;
  "unknown-property-error": string;
  "value-not-empty-error": string;
  "deprecated-warning": string;
  "schema-error": string;
  "unknown-keyword-warning": string;
};
//#endregion
//#region src/SchemaNode.d.ts
declare function isSchemaNode(value: unknown): value is SchemaNode;
declare function isReduceable(node: SchemaNode): boolean;
type Context = {
  /** root node of this JSON Schema */rootNode: SchemaNode; /** available draft configurations */
  drafts: Draft[]; /** [SHARED ACROSS REMOTES] root nodes of registered remote JSON Schema, stored by id/url */
  remotes: Record<string, SchemaNode>; /** references stored by fully resolved schema-$id + local-pointer */
  refs: Record<string, SchemaNode>; /** anchors stored by fully resolved schema-$id + $anchor */
  anchors: Record<string, SchemaNode>; /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
  dynamicAnchors: Record<string, SchemaNode>; /** JSON Schema parser, validator, reducer and resolver for this JSON Schema (root schema and its child nodes) */
  keywords: Draft["keywords"]; /** JSON Schema draft dependend methods */
  methods: Draft["methods"]; /** draft version */
  version: Draft["version"]; /** draft errors & template-strings */
  errors: Draft["errors"]; /** draft formats & validators */
  formats: Draft["formats"]; /** [SHARED USING ADD REMOTE] getData default options */
  getDataDefaultOptions?: TemplateOptions; /** [SHARED USING ADD REMOTE] collect unknown keywords in schemaAnnotations */
  withSchemaAnnotations?: boolean; /** [SHARED USING ADD REMOTE] throw error on validation when ref cannot be resolved */
  throwOnInvalidRef?: boolean;
};
interface SchemaNode extends SchemaNodeMethodsType {
  /** shared context across nodes of JSON schema and shared properties across all remotes */
  context: Context;
  /** JSON Schema of node */
  schema: JsonSchema;
  /**
   * Evaluation Path - The location of the keyword that produced the annotation or error.
   * The purpose of this data is to show the resolution path which resulted in the subschema
   * that contains the keyword.
   *
   * - relative to the root of the principal schema; should include (inline) any $ref segments in the path
   * - JSON pointer
   */
  evaluationPath: string;
  /**
   * Schema Location - The direct location to the keyword that produced the annotation
   * or error. This is provided as a convenience to the user so that they don't have to resolve
   * the keyword's subschema, which may not be trivial task. It is only provided if the relative
   * location contains $refs (otherwise, the two locations will be the same).
   *
   * - absolute URI
   * - may not have any association to the principal schema
   */
  schemaLocation: string;
  /** id created when combining subschemas */
  dynamicId: string;
  /** reference to parent node (node used to compile this node) */
  parent?: SchemaNode | undefined;
  /** JSON Pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer */
  lastIdPointer: string;
  /** when reduced schema containing `oneOf` schema, `oneOfIndex` stores `oneOf`-item used for merge */
  oneOfIndex?: number;
  reducers: JsonSchemaReducer[];
  resolvers: JsonSchemaResolver[];
  validators: JsonSchemaValidator[];
  schemaValidation?: ValidationAnnotation[];
  $id?: string;
  $defs?: Record<string, SchemaNode>;
  $ref?: string;
  additionalProperties?: SchemaNode;
  allOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  contains?: SchemaNode;
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, SchemaNode | boolean>;
  deprecated?: boolean;
  else?: SchemaNode;
  enum?: unknown[];
  if?: SchemaNode;
  /**
   * # Items-array schema - for all drafts
   *
   * - for drafts prior 2020-12 `schema.items[]`-schema stored as `node.prefixItems`
   *
   * Validation succeeds if each element of the instance validates against the schema at the
   * same position, if any.
   *
   * The `prefixItems` keyword restricts a number of items from the start of an array instance
   * to validate against the given sequence of subschemas, where the item at a given index in
   * the array instance is evaluated against the subschema at the given index in the `prefixItems`
   * array, if any. Array items outside the range described by the `prefixItems` keyword is
   * evaluated against the items keyword, if present.
   *
   * [Docs](https://www.learnjsonschema.com/2020-12/applicator/prefixitems/)
   * | [Examples](https://json-schema.org/understanding-json-schema/reference/array#tupleValidation)
   */
  prefixItems?: SchemaNode[];
  /**
   * # Items-object schema for additional array item - for all drafts
   *
   * - for drafts prior 2020-12 `schema.additionalItems` object-schema stored as `node.items`
   *
   * Validation succeeds if each element of the instance not covered by `prefixItems` validates
   * against this schema.
   *
   * The items keyword restricts array instance items not described by the sibling `prefixItems`
   * keyword (if any), to validate against the given subschema. Whetherthis keyword was evaluated
   * against any item of the array instance is reported using annotations.
   *
   * [Docs](https://www.learnjsonschema.com/2020-12/applicator/items/)
   * | [Examples](https://json-schema.org/understanding-json-schema/reference/array#items)
   * | [AdditionalItems Specification](https://json-schema.org/draft/2019-09/draft-handrews-json-schema-02#additionalItems)
   */
  items?: SchemaNode;
  maximum?: number;
  minimum?: number;
  maxItems?: number;
  maxLength?: number;
  maxProperties?: number;
  minItems?: number;
  minLength?: number;
  minProperties?: number;
  not?: SchemaNode;
  oneOf?: SchemaNode[];
  multipleOf?: number;
  pattern?: RegExp;
  patternProperties?: {
    name: string;
    pattern: RegExp;
    node: SchemaNode;
  }[];
  propertyDependencies?: Record<string, Record<string, SchemaNode>>;
  properties?: Record<string, SchemaNode>;
  propertyNames?: SchemaNode;
  required?: string[];
  then?: SchemaNode;
  type?: string | string[];
  unevaluatedItems?: SchemaNode;
  unevaluatedProperties?: SchemaNode;
  uniqueItems?: true;
}
/**
 * Fixed SchemaNode mixin methods
 */
interface SchemaNodeMethodsType {
  compileSchema(schema: JsonSchema | BooleanSchema, evaluationPath?: string, schemaLocation?: string, dynamicId?: string): SchemaNode;
  createError<T extends string = DefaultErrors>(code: T, data: AnnotationData, message?: string): JsonError;
  createAnnotation<T extends string = DefaultErrors>(code: T, data: AnnotationData, message?: string): JsonAnnotation;
  createSchema(data?: unknown): JsonSchema;
  /**
   * Returns a node matching the given location (pointer) in data
   *
   * - the returned node will have a **reduced schema** based on given input data
   * - return returned node $ref is resolved
   *
   * To resolve dynamic schema where the type of JSON Schema is evaluated by
   * its value, a data object has to be passed in options.
   *
   * Per default this function will return `undefined` schema for valid properties
   * that do not have a defined schema. Use the option `withSchemaWarning: true` to
   * receive an error with `code: schema-warning` containing the location of its
   * last evaluated json-schema.
   *
   * @returns { node } or { error } where node can also be undefined (valid but undefined)
   */
  getNode(pointer: string, data: unknown, options: {
    withSchemaWarning: true;
  } & GetNodeOptions): NodeOrError;
  getNode(pointer: string, data: unknown, options: {
    createSchema: true;
  } & GetNodeOptions): NodeOrError;
  getNode(pointer: string, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
  /**
   * Returns the child for the given property-name or array-index
   *
   * - the returned child node is **not reduced**
   * - a child node $ref is resolved
   *
   * @returns { node } or { error } where node can also be undefined (valid but undefined)
   */
  getNodeChild(key: string | number, data: unknown, options: {
    withSchemaWarning: true;
  } & GetNodeOptions): NodeOrError;
  getNodeChild(key: string | number, data: unknown, options: {
    createSchema: true;
  } & GetNodeOptions): NodeOrError;
  getNodeChild(key: string | number, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
  getChildSelection(property: string | number): JsonError | SchemaNode[];
  getNodeRef($ref: string): SchemaNode | undefined;
  getNodeRoot(): SchemaNode;
  getDraftVersion(): string;
  getData(data?: unknown, options?: TemplateOptions): any;
  reduceNode(data: unknown, options?: {
    key?: string | number;
    pointer?: string;
    path?: ValidationPath;
  }): OptionalNodeOrError;
  resolveRef: (args?: {
    pointer?: string;
    path?: ValidationPath;
  }) => SchemaNode;
  validate(data: unknown, pointer?: string, path?: ValidationPath): ValidateReturnType;
  addRemoteSchema(url: string, schema: JsonSchema | BooleanSchema): SchemaNode;
  toSchemaNodes(): SchemaNode[];
  toDataNodes(data: unknown, pointer?: string): DataNode[];
  toJSON(): unknown;
}
type GetNodeOptions = {
  /**
   *  Per default `undefined` is returned for valid data, but undefined schema.
   *
   * - Using `withSchemaWarning:true` will return an error instead: `{ type: "error", code: "schema-warning" }`
   */
  withSchemaWarning?: boolean;
  /**
   *  Per default `undefined` is returned for valid data, but undefined schema.
   *
   * - Using `createSchema:true` will create a schema instead
   */
  createSchema?: boolean;
  path?: ValidationPath;
  pointer?: string;
};
type ValidateReturnType = {
  /**
   * True, if data is valid to the compiled schema.
   * Does not include async errors.
   */
  valid: boolean;
  /**
   * List of validation errors or empty
   */
  errors: JsonError[];
  /**
   * List of annotations from validators
   */
  annotations: JsonAnnotation[];
  /**
   * List of Promises resolving to `JsonError|undefined` or empty.
   */
  errorsAsync: Promise<Maybe<ValidationAnnotation>[]>[];
};
//#endregion
//#region src/types.d.ts
type BooleanSchema = boolean;
interface JsonSchema {
  [keyword: string]: any;
}
declare function isJsonSchema(value: unknown): value is JsonSchema;
declare function isBooleanSchema(value: unknown): value is BooleanSchema;
type JsonPointer = string;
type AnnotationData<D extends Record<string, unknown> = Record<string, unknown>> = D & {
  pointer: string;
  schema: JsonSchema;
  value: unknown;
};
type Annotation<T = string, D extends AnnotationData = AnnotationData, S = string> = {
  type: T;
  code: S;
  message: string;
  data: D;
  [p: string]: unknown;
};
type DefaultErrors = keyof typeof errors;
type ErrorConfig = Record<DefaultErrors | string, string | ((error: AnnotationData) => void)>;
type OptionalNodeOrError = {
  node?: SchemaNode;
  error: undefined;
} | {
  node: undefined;
  error?: JsonError;
};
type NodeOrError = {
  node: SchemaNode;
  error: undefined;
} | {
  node: undefined;
  error: JsonError;
};
type JsonError<D extends AnnotationData = AnnotationData> = Annotation<"error", D, ErrorConfig | string>;
type JsonAnnotation<D extends AnnotationData = AnnotationData> = Annotation<"annotation", D>;
declare function isAnnotation(value: any): value is Annotation;
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
declare function isJsonAnnotation(error: unknown): error is JsonAnnotation;
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
declare function isJsonError(error: unknown): error is JsonError;
//#endregion
export { JsonSchemaResolver as A, DraftVersion as C, DataNode as D, TemplateOptions as E, Maybe as F, ValidationAnnotation as I, ValidationPath as L, JsonSchemaValidator as M, JsonSchemaValidatorParams as N, JsonSchemaReducer as O, Keyword as P, ValidationReturnType as R, Draft as S, extendDraft as T, GetNodeOptions as _, JsonAnnotation as a, isReduceable as b, JsonSchema as c, isAnnotation as d, isBooleanSchema as f, Context as g, isJsonSchema as h, ErrorConfig as i, JsonSchemaResolverParams as j, JsonSchemaReducerParams as k, NodeOrError as l, isJsonError as m, AnnotationData as n, JsonError as o, isJsonAnnotation as p, BooleanSchema as r, JsonPointer as s, Annotation as t, OptionalNodeOrError as u, SchemaNode as v, addKeywords as w, isSchemaNode as x, ValidateReturnType as y };