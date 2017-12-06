# Tasks


## 2018

- [ ] draft06 support
- [ ] -- Improve -- _oneOf-Error messages_ (specific errors where possible, instead of one-of-error)

### possibly

- [ ] improve performance
- [ ] iterate schema: resolve $ref and definitions
- [ ] -- Features -- Helper to find a json- and json-schema-pointer

## 2017

- [ ] -- Change -- addSchema to be set up per instance
- [ ] -- Refactor -- move type validation as keyword to validation/keywords
- [ ] -- Refactor -- Use addValidation to setup base validation mappings?
- [~] -- Features -- Improve validation maps to add & hook (!) custom entries (WIP, Add tests)
- [✓] -- Fix -- Return all errors in oneOf-validation
- [✓] -- Feature -- Error progress notification for async validation
- [✓] -- Refactor -- Keyword validators should only be called for defined keyword
- [✓] -- Feature -- getSchema of patternProperties

**Milestone** add remaining draft04 features
- [✓] -- remote references
- [✓] -- default format validations
- [✓] -- definitions
- [✓] -- dependencies
- [✓] -- Features -- allOf
- [✓] -- Features -- anyOf
- [✓] -- Features -- type-array
- [✓] -- Features -- patternProperties
- [✓] -- Features -- uniqueItems
- [✓] -- Features -- oneOf: fail for multiple matching oneof-schemas
- [✓] -- Features -- oneOf: for non-arrays
- [✓] -- Features -- required (array of properties). Currently every property is required by default


## 16/12

- [✓] Testing (validate real json files)
- [✓] Test + document core differences
- [✓] Add async validation

**Milestone** customizable default and form (json-editor) validation
- [✓] Sanitize Errors 
- [✓] -- Features -- Add core: Form, fix core: Draft04 - by using separate functions
- [✓] Add getTemplate to core (resolveOneOf)
- [✓] -- Breaking -- Add sort of 'core' to customize validation, stepper, errors etc and reduce requried arguments

**Milestone** custom validator (form-validation, oneOfProperty)
- [✓] -- Features -- additionalProperties: Boolean | Schema
- [✓] -- Features -- additionalItems: Boolean | Schema
- [✓] -- Features -- Add support for type "integer"
- [✓] -- Features -- oneOf -> oneOfProperty ( + Documentation)
- [✓] -- Breaking -- change isValid to return boolean
- [✓] -- Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
- [✓] -- Features -- items: [] schema (order/defined indices)
- [✓] -- Features -- not
- [✓] -- Features -- return custom errors in data validation
- [✓] Basics
