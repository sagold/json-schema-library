## Changelog

### v9.0.0

-   [Breaking] error data to always contain `schema` and `value`
-   [Breaking] getSchema arguments changed to options-object
-   [Add] withSchemaWarning option for getSchema to always return an error fpr undefined schema

### v8.0.0

-   [Breaking] renamed `JSON` types and variables to `Json`
-   [Breaking] remove `oneOfSchema` helper property in favor of `getOneOfOrigin()` non-enumerable function
-   [Breaking] `getTemplate` will add only required properties per default. Use `addOptionalProps:true` to change this behaviour
-   [Breaking] change `unique-items-error` to point to error for duplicated item.
-   [add] introduce `mergeSchema`, `reduceSchema` and `resolveDynamicSchema`
-   [refactor] move dynamic resolvers `anyOf`, `allOf`, `oneOf`, `dependencies` and `if` to features modules

### 7.0.0

-   changed core interface to draft for simpler configuration using a configuration map

**Breaking Changes**

-   replaced `Core` interface by new `Draft` interface
-   changed export of `Interface` to `Draft`
-   changed export of `Interface` to `Draft`
-   renamed `addSchema` to `addRemoteSchema`
-   changed api of `compileSchema` to have an additional schema-parameter for rootSchema reference
-   changed `compileSchema` and `addRemoteSchema` to work on instance state, instead of global state
-   `addRemoteSchema`, `compileSchema` now requires draft instance as first parameter
-   removed direct export of following functions: `addValidator`, `compileSchema`, `createSchemaOf`, `each`, `eachSchema`, `getChildSchemaSelection`, `getSchema`, `getTemplate`, `isValid`, `step`, `validate`. They are still accessible under the draftConfigs of each draft-version
-   changed draft version of `JsonEditor` to draft07

**Milestone**

-   [✓] configurable and consistent draft api
-   [✓] expose all function under their draft-version
-   [✓] remove global states in remotes

### 6.1.0

-   [✓] Feature -- add support for dependencies in _getSchema_ and _getTemplate_
-   [✓] Feature -- added isJSONError type guard
-   fixe and improve types

### version 4.0

-   [✓] Fix -- latest benchmark tests
-   [✓] Fix -- iterate schema (using typeDefs)
-   [✓] Fix -- scopes per schema-instance
-   [✓] Fix -- insane $ref resolution 'node' can be in 'root/node' or 'root/folder/node'
-   [✓] Refactor -- remove duplication from resolveRef.strict and resolveRef.withOverwrite
-   [✓] Change -- improve function apis (param order, rootSchema per default)
-   [✓] Fix -- `getTemplate` to resolve $ref to infinity

**Breaking Changes**

-   `iterateSchema` renamed to `eachSchema`
-   `validate` and `isValid` changed signature from (schema, data, [pointer]) to (data, [schema], [pointer])
-   `validateAsync` changed signature from (schema, data, [pointer], [onError]) to (data, [{ schema, pointer, onError }])
-   `getTemplate` changed signature from (schema, data) to (data, [schema])
-   `getSchema` changed signature from (schema, data, [pointer]) to (pointer, [data], [schema])
-   `each` changed signature from (schema, data, [pointer]) to (data, [schema], [pointer])
-   `resolveOneOf` changed signature from (schema, data, [pointer]) to (data, [schema], [pointer])
-   `precompileSchema` renamed to `compileSchema`

**Milestone** consistent feature support

-   [✓] no side-effects on added remote-schemas
-   [✓] rootSchema should always be compiled
-   [✓] Add missing support for allOf and anyOf type definitions in 'step' and 'getTemplate'
-   [✓] Complete schema support in iterateSchema

## 2017

-   [~] Features -- Improve validation maps to add & hook (!) custom entries (WIP, Add tests)
-   [✓] Fix -- Return all errors in oneOf-validation
-   [✓] Feature -- Error progress notification for async validation
-   [✓] Refactor -- Keyword validators should only be called for defined keyword
-   [✓] Feature -- getSchema of patternProperties

**Milestone** add remaining draft04 features

-   [✓] remote references
-   [✓] default format validations
-   [✓] definitions
-   [✓] dependencies
-   [✓] Features -- allOf
-   [✓] Features -- anyOf
-   [✓] Features -- type-array
-   [✓] Features -- patternProperties
-   [✓] Features -- uniqueItems
-   [✓] Features -- oneOf: fail for multiple matching oneof-schemas
-   [✓] Features -- oneOf: for non-arrays
-   [✓] Features -- required (array of properties). Currently every property is required by default

## 16/12

-   [✓] Testing (validate real json files)
-   [✓] Test + document core differences
-   [✓] Add async validation

**Milestone** customizable default and form (json-editor) validation

-   [✓] Sanitize Errors
-   [✓] Features -- Add core: Form, fix core: Draft04 - by using separate functions
-   [✓] Add getTemplate to core (resolveOneOf)
-   [✓] Breaking -- Add sort of 'core' to customize validation, stepper, errors etc and reduce requried arguments

**Milestone** custom validator (form-validation, oneOfProperty)

-   [✓] Features -- additionalProperties: Boolean | Schema
-   [✓] Features -- additionalItems: Boolean | Schema
-   [✓] Features -- Add support for type "integer"
-   [✓] Features -- oneOf -> oneOfProperty ( + Documentation)
-   [✓] Breaking -- change isValid to return boolean
-   [✓] Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
-   [✓] Features -- items: [] schema (order/defined indices)
-   [✓] Features -- not
-   [✓] Features -- return custom errors in data validation
-   [✓] Basics
