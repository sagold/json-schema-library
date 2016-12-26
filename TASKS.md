# Tasks

## 17/01

- [ ] -- Refactor -- type validation as keyword (in validation/keywords)
- [ ] -- Features -- Improve validation maps to add & hook (!) custom entries

**Milestone** add remaining draft04 features
- [ ] -- Features -- patternProperties
- [ ] -- Features -- uniqueItems
- [ ] -- Features -- dependencies
- [ ] -- Features -- allOf
- [ ] -- Features -- anyOf
- [ ] -- Features -- oneOf: failing if multiple schemas match
- [ ] -- Features -- required (array of properties). Currently everything property is required by default


## 16/12

- [ ] Testing (validate real json files)
- [ ] Test + document core differences
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
