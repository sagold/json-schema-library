# Tasks

## 16/12

**Milestone** custom validator (form-validation, oneOfProperty, validate currently existing schemas)

- [ ] -- Breaking -- Add sort of 'core' to custim validation, stepper, errors etc and simplify function depenency inject
- [ ] -- Features -- oneOf -> oneOfProperty ( + Documentation)
- [ ] -- Features -- additionalItems: Boolean | Schema
- [ ] -- Features -- allOf
- [ ] -- Features -- anyOf
- [✓] -- Features -- not
- [✓] -- Features -- items: [] schema (order/defined indices)
- [✓] -- Breaking -- change isValid to return boolean
- [✓] -- Features -- return custom errors in data validation
- [✓] -- Breaking -- use `step` in isValid -- bad: circular dependencies with step -> guessOneOfSchema -> isValid --X-> step
- [✓] Basics
