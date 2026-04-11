`hostname`, `idn-hostname`, `idn-email`, `ipv4`, `ipv6`, `iri`, `iri-reference`, `uri`, `uri-reference`, `uri-template`

## Changelog

###

**Breaking change**: Moved some large format-validators to separate entry point:

- the following format-validators have been moved to a separate entry point "json-schema-library/formats": `hostname`, `idn-email`, `ipv4`, `ipv6`, `uri`, `uri-reference`, `uri-template`
- the following additional format-validators are available through "json-schema-library/formats": `iri`, `iri-reference`, `idn-hostname`

_Use the following to add the additional format validators to drafts per default:_

```ts
import { addFormats } from "json-schema-library/formats";
import { draft04, draft06, draft07, draft2019, draft2020 } from "json-schema-library";
// add additional formats to the following drafts
addFormats([draft04, draft06, draft07, draft2019, draft2020]);
```

### v11.3.0

- added option `draft` as fallback for a missing `$schema` id
- added setting for properties to merge when resolving a `$ref` to `settings.PROPERTIES_TO_MERGE`

### v11.2.0

- introduced `throwOnInvalidRef` to abort validation when a $ref cannot be resolved
- added export of meta-schema for all drafts using `import "json-schema-library/remotes"`
- added support for format validations: `idn-hostname`, `iri`, `iri-reference`

### v11.1.0

- introduced upcoming keyword `propertyDependenciesKeyword` to package export
- added support for keyword `deprecatedMessage`
- introduced schema validation

### v11.0.4, v11.0.5

- removed enforcing packageManager as this failed build-jobs

### v11.0.3

- fixed type of main input-schema to support boolean
- enforced yarn as a package manager

### v11.0.2

- fixed `getNode` to always return a reduced JSON schema
- fixed issues using reduce with `oneOfProperty`

### v11.0.1

- improved error reporting when using oneOfProperty-declarator

### v11.0.0

- introduced annotations
- added node.createAnnotation helper
- changed typing to strict
- added annotations-list to `validate()` result
- added keyword support for `deprecated: true` which returns a `deprecated-warning` annotation

**breaking changes**:

- Return type of validators is now `ValidationReturnType` instead of `ValidationResult`
- type `AnnotationData` replaces `ErroData`

### v10.5.0

- added support for ref resolution in getSchemaType

### v10.4.0

- introduced esm module export
- fixed typo in argument ~~disableRecusionLimit~~ disableRecursionLimit
- added settings to exports for global changes of settings

### v10.3.0

- introduce setting `REGEX_FLAGS` and schema-property `regexFlags` to customize regex flags to use evaluating regex
- fixed an issue resolving non-URI compatible $ref-targets containing `#/definitions`

### v10.2.0

- introduce getData setting `useTypeDefaults`
- introduce support to merge meta-properties using $ref-resolution

### v10.1.0

- replaced `node.additionalItems` by `node.items` for drafts below 2020-12
- fixed `additionalItems` behaviour to be ignored when `schema.items` is not an array

### v10.0.0

> This update involves some significant changes in how you work with the library, so please carefully review the migration guide and adjust your implementation accordingly.

In version v10.0.0, we've made significant changes to the library’s API, particularly in how we handle drafts and schemas. These changes are required to support features like `dynamicAnchor`, `unevaluatedItems`, and `oneOfIndex` and to integrate with the headless-json-editor. The previous approach of directly working with JSON schema objects lacked the flexibility needed for more advanced features and extensibility.

The new implementation revolves around compiling schemas into a **SchemaNode** tree. This change offers a more fitting, simpler, and extensible approach to working with JSON schemas.

#### Key Changes:

- **Compile Schema**: The `compileSchema` function now replaces the previous Draft-Class approach.
- **SchemaNode Representation**: All schemas are now represented as `SchemaNode`, which holds the schema and provides an easier way to work with them.

#### Breaking Changes:

**`compileSchema`** is now a standalone function and replaces the `Draft` class. All return values for JSON Schema are now `SchemaNode` objects that contain a `schema` property.

```ts
// PREVIOUSLY
const draft = new Draft(schema);

// NOW
const node = compileSchema(schema);
```

**Changed Methods**:

- `draft.createSchemaOf(schema)` → `node.createSchema(schema)`
- `draft.each(data, callback)` → `const nodes = node.toDataNodes(data)`
- `draft.eachSchema(callback)` → `const nodes = node.toSchemaNodes()`
- `draft.getChildSchemaSelection(property)` → `node.getChildSelection(property)`
- `draft.getNode(options)` → `node.getNode(pointer, data, options)`
- `draft.getTemplate(inputData)` → `node.getData(inputData)`
- `draft.isValid(data)` → `node.validate(data).valid`
- `draft.step(property, data)` → `node.getNodeChild(property, data)`

**Renamed Properties**: `templateDefaultOptions` → `getDataDefaultOptions`

**Draft Customization**: Customizing drafts has changed completely. The previous methods of extending drafts are no longer valid, and draft handling is now centered around `SchemaNode`.

**Removed Error Property `name`**: Error property `name` has been removed from `JsonError` in favor of `code`.

**Removed Configuration Option**: The `templateDefaultOptions` property has been removed from the global settings object. You should now configure it using the `compileSchema` options:

```ts
compileSchema(schema, {
  getDataDefaultOptions: {
    addOptionalProps: false,
    removeInvalidData: false,
    extendDefaults: true
  }
});
```

**Changed remote $id support** in `addRemoteSchema`. An `$id` has to be a valid url (previously any value was accepted)

### v9.0.0

**breaking changes**:

- _getSchema_ signature changed in favour of an options object. Instead of `draft.getNode(pointer, data)` arguments have to be passed as an object `draft.getNode({ pointer, data })`. This removes setting unwanted optional arguments and keeps the api more stable in the future (e.g. `withSchemaWarning` option)
- _JsonError_ now must expose `pointer`, `schema` and `value` consistently on data property

**updates**

- _getSchema_ consistently returns errors and can return errors for empty schema using `withSchemaWarning` option

### v8.0.0

With version `v8.0.0`, _getData_ was improved to better support optional properties and utilize existing core logic, making it more reliable. Breaking changes:

- Renamed `JSONError` to `JsonError` and `JSONSchema` to `JsonSchema`
- `getData` only adds required properties. Behaviour can be changed by [getData default options](#getData-default-options)
- Internal schema property `oneOfSchema` has been replaced by `schema.getOneOfOrigin()`
- Changed `unique-items-error` to point to error for duplicated item and changed data-properties
- Removed `SchemaService` as it was no longer used nor tested

<details><summary>Exposed new helper functions</summary>

- `mergeSchema` - Merges to two json schema
- `reduceNode` - Reduce schema by merging dynamic constructs into a static json schema omitting those properties
- `isDynamicSchema` - Returns true if the passed schema contains dynamic properties (_if_, _dependencies_, _allOf_, etc)
- `resolveDynamicSchema` - Resolves all dynamic schema definitions for the given input data and returns the resulting JSON Schema without any dynamic schema definitions.

</details>

### 7.0.0

- changed core interface to draft for simpler configuration using a configuration map

**Breaking Changes**

- replaced `Core` interface by new `Draft` interface
- changed export of `Interface` to `Draft`
- changed export of `Interface` to `Draft`
- renamed `addSchema` to `addRemoteSchema`
- changed api of `compileSchema` to have an additional schema-parameter for rootSchema reference
- changed `compileSchema` and `addRemoteSchema` to work on instance state, instead of global state
- `addRemoteSchema`, `compileSchema` now requires draft instance as first parameter
- removed direct export of following functions: `addValidator`, `compileSchema`, `createSchemaOf`, `each`, `eachSchema`, `getChildSchemaSelection`, `getSchema`, `getTemplate`, `isValid`, `step`, `validate`. They are still accessible under the draftConfigs of each draft-version
- changed draft version of `JsonEditor` to draft07

**Milestone**

- [✓] configurable and consistent draft api
- [✓] expose all function under their draft-version
- [✓] remove global states in remotes

### 6.1.0

- [✓] Feature -- add support for dependencies in _getSchema_ and _getTemplate_
- [✓] Feature -- added isJSONError type guard
- fixe and improve types

### version 4.0

- [✓] Fix -- latest benchmark tests
- [✓] Fix -- iterate schema (using typeDefs)
- [✓] Fix -- scopes per schema-instance
- [✓] Fix -- insane $ref resolution 'node' can be in 'root/node' or 'root/folder/node'
- [✓] Refactor -- remove duplication from resolveRef.strict and resolveRef.withOverwrite
- [✓] Change -- improve function apis (param order, rootSchema per default)
- [✓] Fix -- `getTemplate` to resolve $ref to infinity

**Breaking Changes**

- `iterateSchema` renamed to `eachSchema`
- `validate` and `isValid` changed signature from (schema, data, [pointer]) to (data, [schema], [pointer])
- `validateAsync` changed signature from (schema, data, [pointer], [onError]) to (data, [{ schema, pointer, onError }])
- `getTemplate` changed signature from (schema, data) to (data, [schema])
- `getSchema` changed signature from (schema, data, [pointer]) to (pointer, [data], [schema])
- `each` changed signature from (schema, data, [pointer]) to (data, [schema], [pointer])
- `resolveOneOf` changed signature from (schema, data, [pointer]) to (data, [schema], [pointer])
- `precompileSchema` renamed to `compileSchema`

**Milestone** consistent feature support

- [✓] no side-effects on added remote-schemas
- [✓] rootSchema should always be compiled
- [✓] Add missing support for allOf and anyOf type definitions in 'step' and 'getTemplate'
- [✓] Complete schema support in iterateSchema

## 2017

- [~] Features -- Improve validation maps to add & hook (!) custom entries (WIP, Add tests)
- [✓] Fix -- Return all errors in oneOf-validation
- [✓] Feature -- Error progress notification for async validation
- [✓] Refactor -- Keyword validators should only be called for defined keyword
- [✓] Feature -- getSchema of patternProperties

**Milestone** add remaining draft04 features

- [✓] remote references
- [✓] default format validations
- [✓] definitions
- [✓] dependencies
- [✓] Features -- allOf
- [✓] Features -- anyOf
- [✓] Features -- type-array
- [✓] Features -- patternProperties
- [✓] Features -- uniqueItems
- [✓] Features -- oneOf: fail for multiple matching oneof-schemas
- [✓] Features -- oneOf: for non-arrays
- [✓] Features -- required (array of properties). Currently every property is required by default

## 16/12

- [✓] Testing (validate real json files)
- [✓] Test + document core differences
- [✓] Add async validation

**Milestone** customizable default and form (json-editor) validation

- [✓] Sanitize Errors
- [✓] Features -- Add core: Form, fix core: Draft04 - by using separate functions
- [✓] Add getTemplate to core (resolveOneOf)
- [✓] Breaking -- Add sort of 'core' to customize validation, stepper, errors etc and reduce requried arguments

**Milestone** custom validator (form-validation, oneOfProperty)

- [✓] Features -- additionalProperties: Boolean | Schema
- [✓] Features -- additionalItems: Boolean | Schema
- [✓] Features -- Add support for type "integer"
- [✓] Features -- oneOf -> oneOfProperty ( + Documentation)
- [✓] Breaking -- change isValid to return boolean
- [✓] Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
- [✓] Features -- items: [] schema (order/defined indices)
- [✓] Features -- not
- [✓] Features -- return custom errors in data validation
- [✓] Basics
