# Tasks

## 16/12/xx

**Milestone** customizable default and form (json-editor) validation
- [ ] -- Breaking -- Add sort of 'core' to customize validation, stepper, errors etc and reduce requried arguments

**Milestone** custom validator (form-validation, oneOfProperty, validate currently existing schemas)
- [ ] -- Features -- oneOf -> oneOfProperty ( + Documentation)
- [ ] -- Features -- additionalItems: Boolean | Schema
- [ ] -- Features -- Add support for type "integer"
- [✓] -- Breaking -- change isValid to return boolean
- [✓] -- Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
- [✓] -- Features -- items: [] schema (order/defined indices)
- [✓] -- Features -- not
- [✓] -- Features -- return custom errors in data validation
- [✓] Basics
