//#region src/Keyword.d.ts
type ValidationPath = {
  pointer: string;
  node: SchemaNode;
}[];
type JsonSchemaReducerParams = {
  /** data of current node */
  data: unknown;
  /** optional key to used to resolve by property without having data */
  key?: string | number;
  /** node to reduce */
  node: SchemaNode;
  /** JSON pointer to data */
  pointer: string;
  /** passed through path for schema resolution, will be changed by reference */
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
type ValidationResult$1 = JsonError | Promise<JsonError>;
type JsonSchemaValidatorParams = {
  pointer?: string;
  data: unknown;
  node: SchemaNode;
  path?: ValidationPath;
};
interface JsonSchemaValidator {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaValidatorParams): undefined | ValidationResult$1 | ValidationResult$1[];
}
type Keyword = {
  id: string;
  /** unique keyword corresponding to JSON Schema keywords (or custom) */
  keyword: string;
  /** sort order of keyword. Lower numbers will be processed last. Default is 0 */
  order?: number;
  /** called with compileSchema */
  parse?: (node: SchemaNode) => void;
  addResolve?: (node: SchemaNode) => boolean;
  /** return node corresponding to passed in key or do nothing */
  resolve?: JsonSchemaResolver;
  addValidate?: (node: SchemaNode) => boolean;
  /** validate data using node */
  validate?: JsonSchemaValidator;
  addReduce?: (node: SchemaNode) => boolean;
  /** remove dynamic schema-keywords by merging valid sub-schemas */
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
declare function toDataNodes$1(node: SchemaNode, data: unknown, pointer?: string, dataNodes?: DataNode[]): DataNode[];
//#endregion
//#region src/methods/getChildSelection.d.ts
/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
declare function getChildSelection$1(node: SchemaNode, property: string | number): SchemaNode[] | JsonError;
//#endregion
//#region src/methods/getData.d.ts
type TemplateOptions = {
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
   * Set to false to not use type specific initial values.Defaults to true
   */
  useTypeDefaults?: boolean;
  /**
   * Limits how often a $ref should be followed before aborting. Prevents infinite data-structure.
   * Defaults to 1
   */
  recursionLimit?: number;
  /** @internal disables recursion limit for next call */
  disableRecursionLimit?: boolean;
  /** @internal context to track recursion limit */
  cache?: Record<string, Record<string, number>>;
};
declare function getData$1(node: SchemaNode, data?: unknown, opts?: TemplateOptions): any;
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
    getChildSelection: typeof getChildSelection$1;
    getData: typeof getData$1;
    toDataNodes: typeof toDataNodes$1;
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
  "format-ipv4-error": string;
  "format-ipv4-leading-zero-error": string;
  "format-ipv6-error": string;
  "format-ipv6-leading-zero-error": string;
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
  "required-property-error": string;
  /** return schema-warning with createSchemaWarning:true when a valid, but undefined  property was found */
  "schema-warning": string;
  "type-error": string;
  "undefined-value-error": string;
  "unevaluated-property-error": string;
  "unevaluated-items-error": string;
  "unique-items-error": string;
  "unknown-property-error": string;
  "value-not-empty-error": string;
};
//#endregion
//#region dist/index.d.mts
//#region src/Keyword.d.ts
type ValidationPath$1 = {
  pointer: string;
  node: SchemaNode$1;
}[];
type JsonSchemaReducerParams$1 = {
  /** data of current node */
  data: unknown;
  /** optional key to used to resolve by property without having data */
  key?: string | number;
  /** node to reduce */
  node: SchemaNode$1;
  /** JSON pointer to data */
  pointer: string;
  /** passed through path for schema resolution, will be changed by reference */
  path: ValidationPath$1;
};
interface JsonSchemaReducer$1 {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaReducerParams$1): SchemaNode$1 | JsonError$1 | undefined;
}
type JsonSchemaResolverParams$1 = {
  key: string | number;
  data: unknown;
  node: SchemaNode$1;
};
interface JsonSchemaResolver$1 {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaResolverParams$1): SchemaNode$1 | JsonError$1 | undefined;
}
type ValidationResult = JsonError$1 | Promise<JsonError$1>;
type JsonSchemaValidatorParams$1 = {
  pointer?: string;
  data: unknown;
  node: SchemaNode$1;
  path?: ValidationPath$1;
};
interface JsonSchemaValidator$1 {
  toJSON?: () => string;
  order?: number;
  (options: JsonSchemaValidatorParams$1): undefined | ValidationResult | ValidationResult[];
}
type Keyword$1 = {
  id: string;
  /** unique keyword corresponding to JSON Schema keywords (or custom) */
  keyword: string;
  /** sort order of keyword. Lower numbers will be processed last. Default is 0 */
  order?: number;
  /** called with compileSchema */
  parse?: (node: SchemaNode$1) => void;
  addResolve?: (node: SchemaNode$1) => boolean;
  /** return node corresponding to passed in key or do nothing */
  resolve?: JsonSchemaResolver$1;
  addValidate?: (node: SchemaNode$1) => boolean;
  /** validate data using node */
  validate?: JsonSchemaValidator$1;
  addReduce?: (node: SchemaNode$1) => boolean;
  /** remove dynamic schema-keywords by merging valid sub-schemas */
  reduce?: JsonSchemaReducer$1;
};
//#endregion
//#region src/methods/createSchema.d.ts
/**
 * Create a simple json schema for the given input data
 * @param  data - data to get json schema for
 */
declare function createSchema$1(data: unknown): JsonSchema$1;
//#endregion
//#region src/methods/toDataNodes.d.ts
type DataNode$1 = {
  node: SchemaNode$1;
  value: unknown;
  pointer: string;
};
declare function toDataNodes(node: SchemaNode$1, data: unknown, pointer?: string, dataNodes?: DataNode$1[]): DataNode$1[];
//#endregion
//#region src/methods/getChildSelection.d.ts
/**
 * Returns a list of possible child-schemas for the given property key. In case of a oneOf selection, multiple schemas
 * could be added at the given property (e.g. item-index), thus an array of options is returned. In all other cases
 * a list with a single item will be returned
 */
declare function getChildSelection(node: SchemaNode$1, property: string | number): SchemaNode$1[] | JsonError$1;
//#endregion
//#region src/methods/getData.d.ts
type TemplateOptions$1 = {
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
   * Set to false to not use type specific initial values.Defaults to true
   */
  useTypeDefaults?: boolean;
  /**
   * Limits how often a $ref should be followed before aborting. Prevents infinite data-structure.
   * Defaults to 1
   */
  recursionLimit?: number;
  /** @internal disables recursion limit for next call */
  disableRecursionLimit?: boolean;
  /** @internal context to track recursion limit */
  cache?: Record<string, Record<string, number>>;
};
declare function getData(node: SchemaNode$1, data?: unknown, opts?: TemplateOptions$1): any;
//#endregion
//#region src/Draft.d.ts
type DraftVersion$1 = "draft-04" | "draft-06" | "draft-07" | "draft-2019-09" | "draft-2020-12" | "latest";
interface Draft$1 {
  /** test-string if draft can be used with $schema-url */
  $schemaRegEx: string;
  /** draft-version of this draft, e.g. draft-2020-12 */
  version: DraftVersion$1;
  /** supported keywords and implementation */
  keywords: Keyword$1[];
  /** draft-dependent methods */
  methods: {
    createSchema: typeof createSchema$1;
    getChildSelection: typeof getChildSelection;
    getData: typeof getData;
    toDataNodes: typeof toDataNodes;
  };
  /** meta-schema url associated with this draft */
  $schema?: string;
  /** draft errors (this can still be global) */
  errors: ErrorConfig$1;
  formats: Record<string, JsonSchemaValidator$1>;
}
//#endregion
//#region src/errors/errors.d.ts
declare const errors$1: {
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
  "format-ipv4-error": string;
  "format-ipv4-leading-zero-error": string;
  "format-ipv6-error": string;
  "format-ipv6-leading-zero-error": string;
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
  "required-property-error": string;
  /** return schema-warning with createSchemaWarning:true when a valid, but undefined  property was found */
  "schema-warning": string;
  "type-error": string;
  "undefined-value-error": string;
  "unevaluated-property-error": string;
  "unevaluated-items-error": string;
  "unique-items-error": string;
  "unknown-property-error": string;
  "value-not-empty-error": string;
};
//#endregion
//#region src/getNode.d.ts
declare function getNode$1(pointer: string, data: unknown, options: {
  withSchemaWarning: true;
} & GetNodeOptions$1): NodeOrError$1;
declare function getNode$1(pointer: string, data: unknown, options: {
  createSchema: true;
} & GetNodeOptions$1): NodeOrError$1;
declare function getNode$1(pointer: string, data?: unknown, options?: GetNodeOptions$1): OptionalNodeOrError$1;
//#endregion
//#region src/getNodeChild.d.ts
declare function getNodeChild$1(key: string | number, data: unknown, options: {
  withSchemaWarning: true;
} & GetNodeOptions$1): NodeOrError$1;
declare function getNodeChild$1(key: string | number, data: unknown, options: {
  createSchema: true;
} & GetNodeOptions$1): NodeOrError$1;
declare function getNodeChild$1(key: string | number, data?: unknown, options?: GetNodeOptions$1): OptionalNodeOrError$1;
//#endregion
//#region src/SchemaNode.d.ts

type Context$1 = {
  /** root node of this JSON Schema */
  rootNode: SchemaNode$1;
  /** available draft configurations */
  drafts: Draft$1[];
  /** [SHARED ACROSS REMOTES] root nodes of registered remote JSON Schema, stored by id/url */
  remotes: Record<string, SchemaNode$1>;
  /** references stored by fully resolved schema-$id + local-pointer */
  refs: Record<string, SchemaNode$1>;
  /** anchors stored by fully resolved schema-$id + $anchor */
  anchors: Record<string, SchemaNode$1>;
  /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
  dynamicAnchors: Record<string, SchemaNode$1>;
  /** JSON Schema parser, validator, reducer and resolver for this JSON Schema (root schema and its child nodes) */
  keywords: Draft$1["keywords"];
  /** JSON Schema draft dependend methods */
  methods: Draft$1["methods"];
  /** draft version */
  version: Draft$1["version"];
  /** draft errors & template-strings */
  errors: Draft$1["errors"];
  /** draft formats & validators */
  formats: Draft$1["formats"];
  /** [SHARED USING ADD REMOTE] getData default options */
  getDataDefaultOptions?: TemplateOptions$1;
};
interface SchemaNode$1 extends SchemaNodeMethodsType$1 {
  /** shared context across nodes of JSON schema and shared properties across all remotes */
  context: Context$1;
  /** JSON Schema of node */
  schema: JsonSchema$1;
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
  parent?: SchemaNode$1 | undefined;
  /** JSON Pointer from last $id ~~to this location~~ to resolve $refs to $id#/idLocalPointer */
  lastIdPointer: string;
  /** when reduced schema containing `oneOf` schema, `oneOfIndex` stores `oneOf`-item used for merge */
  oneOfIndex?: number;
  reducers: JsonSchemaReducer$1[];
  resolvers: JsonSchemaResolver$1[];
  validators: JsonSchemaValidator$1[];
  resolveRef?: (args?: {
    pointer?: string;
    path?: ValidationPath$1;
  }) => SchemaNode$1;
  $id?: string;
  $defs?: Record<string, SchemaNode$1>;
  $ref?: string;
  additionalProperties?: SchemaNode$1;
  allOf?: SchemaNode$1[];
  anyOf?: SchemaNode$1[];
  contains?: SchemaNode$1;
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, SchemaNode$1 | boolean>;
  else?: SchemaNode$1;
  if?: SchemaNode$1;
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
  prefixItems?: SchemaNode$1[];
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
  items?: SchemaNode$1;
  not?: SchemaNode$1;
  oneOf?: SchemaNode$1[];
  patternProperties?: {
    name: string;
    pattern: RegExp;
    node: SchemaNode$1;
  }[];
  properties?: Record<string, SchemaNode$1>;
  propertyNames?: SchemaNode$1;
  then?: SchemaNode$1;
  unevaluatedItems?: SchemaNode$1;
  unevaluatedProperties?: SchemaNode$1;
}
type SchemaNodeMethodsType$1 = typeof SchemaNodeMethods$1;
type GetNodeOptions$1 = {
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
  path?: ValidationPath$1;
  pointer?: string;
};
type ValidateReturnType$1 = {
  /**
   * True, if data is valid to the compiled schema.
   * Does not include async errors.
   */
  valid: boolean;
  /**
   * List of validation errors or empty
   */
  errors: JsonError$1[];
  /**
   * List of Promises resolving to `JsonError|undefined` or empty.
   */
  errorsAsync: Promise<JsonError$1 | undefined>[];
};
declare const SchemaNodeMethods$1: {
  /**
   * Compiles a child-schema of this node to its context
   * @returns SchemaNode representing the passed JSON Schema
   */
  readonly compileSchema: (schema: JsonSchema$1, evaluationPath?: string, schemaLocation?: string, dynamicId?: string) => SchemaNode$1;
  readonly createError: <T extends string = "additional-items-error" | "additional-properties-error" | "all-of-error" | "any-of-error" | "const-error" | "contains-any-error" | "contains-array-error" | "contains-error" | "contains-min-error" | "contains-max-error" | "enum-error" | "exclusive-maximum-error" | "exclusive-minimum-error" | "forbidden-property-error" | "format-date-error" | "format-date-time-error" | "format-duration-error" | "format-email-error" | "format-hostname-error" | "format-ipv4-error" | "format-ipv4-leading-zero-error" | "format-ipv6-error" | "format-ipv6-leading-zero-error" | "format-json-pointer-error" | "format-regex-error" | "format-time-error" | "format-uri-error" | "format-uri-reference-error" | "format-uri-template-error" | "format-url-error" | "format-uuid-error" | "invalid-data-error" | "invalid-property-name-error" | "maximum-error" | "max-items-error" | "max-length-error" | "max-properties-error" | "minimum-error" | "min-items-error" | "min-items-one-error" | "min-length-error" | "min-length-one-error" | "missing-one-of-declarator-error" | "min-properties-error" | "missing-array-item-error" | "missing-dependency-error" | "missing-one-of-property-error" | "multiple-of-error" | "multiple-one-of-error" | "no-additional-properties-error" | "not-error" | "one-of-error" | "one-of-property-error" | "pattern-error" | "pattern-properties-error" | "required-property-error" | "schema-warning" | "type-error" | "undefined-value-error" | "unevaluated-property-error" | "unevaluated-items-error" | "unique-items-error" | "unknown-property-error" | "value-not-empty-error">(code: T, data: ErrorData$1, message?: string) => JsonError$1;
  readonly createSchema: typeof createSchema$1;
  readonly getChildSelection: (property: string | number) => JsonError$1 | SchemaNode$1[];
  readonly getNode: typeof getNode$1;
  readonly getNodeChild: typeof getNodeChild$1;
  /**
   * @returns for $ref, the corresponding SchemaNode or undefined
   */
  readonly getNodeRef: ($ref: string) => SchemaNode$1 | undefined;
  readonly getNodeRoot: () => SchemaNode$1;
  /**
   * @returns draft version this JSON Schema is evaluated by
   */
  readonly getDraftVersion: () => DraftVersion$1;
  /**
   * @returns data that is valid to the schema of this node
   */
  readonly getData: (data?: unknown, options?: TemplateOptions$1) => any;
  /**
   * @returns SchemaNode with a reduced JSON Schema matching the given data
   */
  readonly reduceNode: (data: unknown, options?: {
    key?: string | number;
    pointer?: string;
    path?: ValidationPath$1;
  }) => OptionalNodeOrError$1;
  /**
   * @returns validation result of data validated by this node's JSON Schema
   */
  readonly validate: (data: unknown, pointer?: string, path?: ValidationPath$1) => ValidateReturnType$1;
  /**
   * Register a JSON Schema as a remote-schema to be resolved by $ref, $anchor, etc
   * @returns the current node (not the remote schema-node)
   */
  readonly addRemoteSchema: (url: string, schema: JsonSchema$1) => SchemaNode$1;
  /**
   * @returns a list of all sub-schema as SchemaNode
   */
  readonly toSchemaNodes: () => SchemaNode$1[];
  /**
   * @returns a list of values (including objects and arrays) and their corresponding JSON Schema as SchemaNode
   */
  readonly toDataNodes: (data: unknown, pointer?: string) => DataNode$1[];
  readonly toJSON: () => any;
};
//#endregion
//#region src/types.d.ts
interface JsonSchema$1 {
  [p: string]: any;
}
type DefaultErrors$1 = keyof typeof errors$1;
type ErrorConfig$1 = Record<DefaultErrors$1 | string, string | ((error: ErrorData$1) => void)>;
type OptionalNodeOrError$1 = {
  node?: SchemaNode$1;
  error: undefined;
} | {
  node: undefined;
  error?: JsonError$1;
};
type NodeOrError$1 = {
  node: SchemaNode$1;
  error: undefined;
} | {
  node: undefined;
  error: JsonError$1;
};
type ErrorData$1<T extends Record<string, unknown> = {
  [p: string]: unknown;
}> = T & {
  pointer: string;
  schema: JsonSchema$1;
  value: unknown;
};
type JsonError$1<T extends ErrorData$1 = ErrorData$1> = {
  type: "error";
  code: ErrorConfig$1 | string;
  message: string;
  data: T;
  [p: string]: unknown;
};
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
//#endregion
//#region src/getNode.d.ts
declare function getNode(pointer: string, data: unknown, options: {
  withSchemaWarning: true;
} & GetNodeOptions): NodeOrError;
declare function getNode(pointer: string, data: unknown, options: {
  createSchema: true;
} & GetNodeOptions): NodeOrError;
declare function getNode(pointer: string, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
//#endregion
//#region src/getNodeChild.d.ts
declare function getNodeChild(key: string | number, data: unknown, options: {
  withSchemaWarning: true;
} & GetNodeOptions): NodeOrError;
declare function getNodeChild(key: string | number, data: unknown, options: {
  createSchema: true;
} & GetNodeOptions): NodeOrError;
declare function getNodeChild(key: string | number, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
//#endregion
//#region src/SchemaNode.d.ts
declare function isSchemaNode(value: unknown): value is SchemaNode;
declare function isReduceable(node: SchemaNode): boolean;
type Context = {
  /** root node of this JSON Schema */
  rootNode: SchemaNode;
  /** available draft configurations */
  drafts: Draft[];
  /** [SHARED ACROSS REMOTES] root nodes of registered remote JSON Schema, stored by id/url */
  remotes: Record<string, SchemaNode>;
  /** references stored by fully resolved schema-$id + local-pointer */
  refs: Record<string, SchemaNode>;
  /** anchors stored by fully resolved schema-$id + $anchor */
  anchors: Record<string, SchemaNode>;
  /** [SHARED ACROSS REMOTES] dynamicAnchors stored by fully resolved schema-$id + $anchor */
  dynamicAnchors: Record<string, SchemaNode>;
  /** JSON Schema parser, validator, reducer and resolver for this JSON Schema (root schema and its child nodes) */
  keywords: Draft["keywords"];
  /** JSON Schema draft dependend methods */
  methods: Draft["methods"];
  /** draft version */
  version: Draft["version"];
  /** draft errors & template-strings */
  errors: Draft["errors"];
  /** draft formats & validators */
  formats: Draft["formats"];
  /** [SHARED USING ADD REMOTE] getData default options */
  getDataDefaultOptions?: TemplateOptions;
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
  resolveRef?: (args?: {
    pointer?: string;
    path?: ValidationPath;
  }) => SchemaNode;
  $id?: string;
  $defs?: Record<string, SchemaNode>;
  $ref?: string;
  additionalProperties?: SchemaNode;
  allOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  contains?: SchemaNode;
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, SchemaNode | boolean>;
  else?: SchemaNode;
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
  not?: SchemaNode;
  oneOf?: SchemaNode[];
  patternProperties?: {
    name: string;
    pattern: RegExp;
    node: SchemaNode;
  }[];
  properties?: Record<string, SchemaNode>;
  propertyNames?: SchemaNode;
  then?: SchemaNode;
  unevaluatedItems?: SchemaNode;
  unevaluatedProperties?: SchemaNode;
}
type SchemaNodeMethodsType = typeof SchemaNodeMethods;
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
   * List of Promises resolving to `JsonError|undefined` or empty.
   */
  errorsAsync: Promise<JsonError | undefined>[];
};
declare const SchemaNodeMethods: {
  /**
   * Compiles a child-schema of this node to its context
   * @returns SchemaNode representing the passed JSON Schema
   */
  readonly compileSchema: (schema: JsonSchema, evaluationPath?: string, schemaLocation?: string, dynamicId?: string) => SchemaNode;
  readonly createError: <T extends string = "additional-items-error" | "additional-properties-error" | "all-of-error" | "any-of-error" | "const-error" | "contains-any-error" | "contains-array-error" | "contains-error" | "contains-min-error" | "contains-max-error" | "enum-error" | "exclusive-maximum-error" | "exclusive-minimum-error" | "forbidden-property-error" | "format-date-error" | "format-date-time-error" | "format-duration-error" | "format-email-error" | "format-hostname-error" | "format-ipv4-error" | "format-ipv4-leading-zero-error" | "format-ipv6-error" | "format-ipv6-leading-zero-error" | "format-json-pointer-error" | "format-regex-error" | "format-time-error" | "format-uri-error" | "format-uri-reference-error" | "format-uri-template-error" | "format-url-error" | "format-uuid-error" | "invalid-data-error" | "invalid-property-name-error" | "maximum-error" | "max-items-error" | "max-length-error" | "max-properties-error" | "minimum-error" | "min-items-error" | "min-items-one-error" | "min-length-error" | "min-length-one-error" | "missing-one-of-declarator-error" | "min-properties-error" | "missing-array-item-error" | "missing-dependency-error" | "missing-one-of-property-error" | "multiple-of-error" | "multiple-one-of-error" | "no-additional-properties-error" | "not-error" | "one-of-error" | "one-of-property-error" | "pattern-error" | "pattern-properties-error" | "required-property-error" | "schema-warning" | "type-error" | "undefined-value-error" | "unevaluated-property-error" | "unevaluated-items-error" | "unique-items-error" | "unknown-property-error" | "value-not-empty-error">(code: T, data: ErrorData, message?: string) => JsonError;
  readonly createSchema: typeof createSchema;
  readonly getChildSelection: (property: string | number) => JsonError | SchemaNode[];
  readonly getNode: typeof getNode;
  readonly getNodeChild: typeof getNodeChild;
  /**
   * @returns for $ref, the corresponding SchemaNode or undefined
   */
  readonly getNodeRef: ($ref: string) => SchemaNode | undefined;
  readonly getNodeRoot: () => SchemaNode;
  /**
   * @returns draft version this JSON Schema is evaluated by
   */
  readonly getDraftVersion: () => DraftVersion;
  /**
   * @returns data that is valid to the schema of this node
   */
  readonly getData: (data?: unknown, options?: TemplateOptions) => any;
  /**
   * @returns SchemaNode with a reduced JSON Schema matching the given data
   */
  readonly reduceNode: (data: unknown, options?: {
    key?: string | number;
    pointer?: string;
    path?: ValidationPath;
  }) => OptionalNodeOrError;
  /**
   * @returns validation result of data validated by this node's JSON Schema
   */
  readonly validate: (data: unknown, pointer?: string, path?: ValidationPath) => ValidateReturnType;
  /**
   * Register a JSON Schema as a remote-schema to be resolved by $ref, $anchor, etc
   * @returns the current node (not the remote schema-node)
   */
  readonly addRemoteSchema: (url: string, schema: JsonSchema) => SchemaNode;
  /**
   * @returns a list of all sub-schema as SchemaNode
   */
  readonly toSchemaNodes: () => SchemaNode[];
  /**
   * @returns a list of values (including objects and arrays) and their corresponding JSON Schema as SchemaNode
   */
  readonly toDataNodes: (data: unknown, pointer?: string) => DataNode$1[];
  readonly toJSON: () => any;
};
//#endregion
//#region src/types.d.ts
interface JsonSchema {
  [p: string]: any;
}
type JsonPointer = string;
type DefaultErrors = keyof typeof errors;
type ErrorConfig = Record<DefaultErrors | string, string | ((error: ErrorData) => void)>;
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
type ErrorData<T extends Record<string, unknown> = {
  [p: string]: unknown;
}> = T & {
  pointer: string;
  schema: JsonSchema;
  value: unknown;
};
type JsonError<T extends ErrorData = ErrorData> = {
  type: "error";
  code: ErrorConfig | string;
  message: string;
  data: T;
  [p: string]: unknown;
};
/**
 * ts type guard for json error
 * @returns true if passed type is a JsonError
 */
declare function isJsonError(error: any): error is JsonError;
//#endregion
//#region src/compileSchema.d.ts
type CompileOptions = {
  drafts?: Draft[];
  remote?: SchemaNode;
  formatAssertion?: boolean | "meta-schema";
  getDataDefaultOptions?: TemplateOptions;
};
/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation as possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
declare function compileSchema(schema: JsonSchema, options?: CompileOptions): SchemaNode;
//#endregion
//#region src/settings.d.ts
declare const _default: {
  DECLARATOR_ONEOF: string;
  propertyBlacklist: string[];
  DYNAMIC_PROPERTIES: string[];
  REGEX_FLAGS: string;
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
 * @draft-editor https://json-schema.org/draft/2019-09/release-notes
 *
 * Uses Draft 2019-09 and changes resolveOneOf to be fuzzy
 */
declare const draftEditor: Draft;
//#endregion
//#region src/keywords/oneOf.d.ts
declare const oneOfKeyword: Keyword;
declare const oneOfFuzzyKeyword: Keyword;
//#endregion
//#region src/errors/render.d.ts
declare function render(template: string, data?: {
  [p: string]: any;
}): string;
//#endregion
//#region src/utils/getTypeOf.d.ts
type JSType = "array" | "bigint" | "boolean" | "function" | "null" | "number" | "object" | "string" | "symbol" | "undefined";
declare function getTypeOf(value: unknown): JSType;
//#endregion
//#region src/mergeNode.d.ts
declare function mergeNode(a: SchemaNode, b?: SchemaNode, ...omit: string[]): SchemaNode | undefined;
//#endregion
//#region src/utils/mergeSchema.d.ts
declare function mergeSchema<T extends JsonSchema>(a: T, b: T, ...omit: string[]): T;
//#endregion
//#region src/utils/getSchemaType.d.ts
declare const SCHEMA_TYPES: string[];
/**
 * @helper for getData
 * returns schema type, which might be an educated guess based on defined schema
 * properties if an exact type cannot be retried from type.
 */
declare function getSchemaType(node: SchemaNode, data: unknown): keyof typeof SCHEMA_TYPES | undefined;
//#endregion
//#region remotes/index.d.ts
/** remote meta-schema stored by schema $id */
declare const remotes: Record<string, any>;
//#endregion
export { type CompileOptions, type Context, type DataNode, type Draft, type DraftVersion, type ErrorConfig, type ErrorData, type GetNodeOptions, type JsonError, type JsonPointer, type JsonSchema, type JsonSchemaReducer, type JsonSchemaReducerParams, type JsonSchemaResolver, type JsonSchemaResolverParams, type JsonSchemaValidator, type JsonSchemaValidatorParams, type Keyword, type NodeOrError, type OptionalNodeOrError, type SchemaNode, type ValidateReturnType, type ValidationPath, addKeywords, compileSchema, draft04, draft06, draft07, draft2019, draft2020, draftEditor, extendDraft, getSchemaType, getTypeOf, isJsonError, isReduceable, isSchemaNode, mergeNode, mergeSchema, oneOfFuzzyKeyword, oneOfKeyword, remotes, render, _default as settings };