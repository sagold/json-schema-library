# json-schema-library

**Customizable and hackable json-validator and json-schema utilities for traversal, data generation and validation**

> This package offers tools and utilities to work with json-schema, create and validate data. Unfortunately, most
> packages, editors or validators do not care to expose basic json-schema functionality. Instead of small memory
> footprint or high performance, this package focuses on exposing utilities for browser and node environments and
> lessens the pain to build custom tools around json-schema.

`npm i json-schema-library`.

This package is tested on node v6.9.1.


1. [Overview](#overview)
    1. [Core](#core)
    1. [Add Custom Validators](#add-custom-validators)
1. [Custom Extensions](#custom-extensions)


## Overview

Either select an existing __validator__ (`core`) or create your own. Each __Core__ holds all functions that are required
for the json-schema operations like validation. In order to overwrite a custom function you can either

- modify the map-objects (i.e. [/lib/validation/keywords](./lib/validation/keywords))
- overwrite functions or keys in the generated instance (`const instance = new Core()`)
- Create a custom __Core__ following the examples in [/lib/cores](./lib/cores)

Additionally, helper functions and tools are separately exposed via CommonJS Modules. Most of them do require a
core-object as parameter, but use only some of the functions defined in an core-instance.


### Core

The default interface of a validator can be found in [/lib/cores/CoreInterface](./lib/cores/CoreInterface). It exposes
the following methods

| method            | signature                             | description
| ----------------- | ------------------------------------- | -------------------------------------------------------------
| constructor       | schema : instance                     | pass the root-schema in the constructor
| each              | schema, data, callback, [pointer]     | Iterates over the data, passing value and its schema
| step              | key, schema, data, [pointer] : Schema | step into a json-schema by the given key (property or index)
| validate          | schema, data, [pointer] : Array       | Get a list of validation errors
| isValid           | schema, data, [pointer] : Boolean     | Check if the given schema validates the data
| resolveOneOf      | schema, data, [pointer] : Schema      | returns the oneOf-schema for the passed data
| resolveRef        | schema : Schema                       | resolves a $ref on a given schema-object
| getSchema         | schema, data, [pointer] : Schema      | Get the json-schema describing the `data` found at `pointer`
| getTemplate       | schema, data : Mixed                  | returns a template object based of the given json-schema
| setSchema         | schema                                | set or change the root-schema


Each core holds some mapping objects, that may be modified

```js
Core {
    // keyword validations for each type, e.g. "array": ["enum", "items", "minItems", "maxItems", ...]
    // for each item in the given list, the validation function in `validationKeyword` will be called
    typeKeywords: {} 
    // keyword validation functions, e.g. validateKeyword.enum(), validateKeyword.items(), ...
    validateKeyword: {}
    // type validation for array, object, number, etc. Basically runs over typeKeywords and executes
    // validation functions from `validateKeyword`
    validateType: {}
    // format validation functions. will be executed if a) typeKeywords includes 'format' and a
    // validation function is set in validateFormat
    validateFormat: {}
    // list of error-creator functions. They receive an object with the data of the error and must
    // return an object like { type: 'error', message: "" }
    errors: {}
}
```


#### Examples

##### getSchema(core, schema, pointer, data)
> Get the json-schema describing the `data` found at `pointer`.

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const targetSchema = core.getSchema(rootSchema, '#/path/to/target', rootData);
```

Currently may also return an error:

```js
if (targetSchema.type === "error") {
    throw new Error(targetSchema.message);
}
```

Or using `getSchema` directly

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const targetSchema = getSchema(core, rootSchema, '#/path/to/target', rootData);
```


##### getTemplate(core, schema, data, rootSchema = schema)
> Generate data which is valid to the given json-schema. Additionally, a data object may be given, which will be
extended by any missing items or properties.

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core();
const baseData = core.getTemplate(
    { type: "object", properties: { target: { type: "string", default: "v" } } },
    { other: true }
); // returns { other: true, target: "v" }
```

##### validate(core, data, schema, step)
> Get a list of validation errors

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const errors = core.validate({ type: "number" }, "");
// returns { type: "TypeError" }
```

##### isValid(core, data, schema, step)
> Check if the given schema validates the data

basically `core.validate({ type: "number" }, "").length === 0`

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const baseSchema = core.isValid({ type: "number" }, "");
// returns false
```

##### validate(core, data, schema, step)
> Asynchronous validation helper

Optional support for onError helper, which is invoked for each error (after being resolved)

```js
const Core = require("json-schema-library").cores.Draft04;
const validateAsync = require("json-schema-library").validateAsync;
const core = new Core(rootSchema);
// signature: Core, Schema, Data, [Pointer], [onErrorCallback] : Promise
validateAsync(core, { type: "number" }, "", "#", function onError(err) {})
    .then((allErrors) => {})
```

##### step(core, key, schema, data, rootSchema = schema)
> Get the json-schema of a child-property

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const baseSchema = core.step(
    { type: "object", properties: { target: {type: "string"}} },
    { target: "value" }
    "target", 
); // returns {type: "string"}
```

##### each(core, data, schema, callback)
> Iterates over each data-item (object, array and value); passing the value and its corresponding schema

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core({
    type: "array",
    items: [
        { type: "number" },
        { type: "string" }
    ]
});
core.each(core.rootSchema, [5, "nine"], (schema, value, pointer) => {
// 1. schema = { type: "array", items: [...] }, data = [5, "nine"], pointer = #
// 2. schema = { type: "number" }, data = 5, pointer = #/0
// 3. schema = { type: "string" }, data = "nine", pointer = #/1
});
```


### Add custom validators

```js
const addValidator = require("../../lib/addValidator");
const Core = require("../../lib/cores/draft04");

// add a custom format 'id'
addValidator.format(core, "id", (core, schema, value, pointer) => {});

// add custom keyword 'capitalized' for type 'string'
addValidator.keyword(core, "string", "capitalized", (core, schema, value, pointer) => {});

// add a custom error (may overwrite existing errors)
addValidator.error(core, "minLengthError", (data) => ({
    type: "error",
    code: "custom-min-length-error",
    message: "my custom error message",
    data
}));
```


### Additional helpers

#### SchemaService(schema)
Retrieve the json-schema at the given json-pointer

```js
const schemaService = new SchemaService(rootSchema); // default core 'draft04'
const targetSchema = schemaService.get('#/path/to/target', rootData);
```

#### getChildSchemaSelection
Returns a list of possible schemas for the given child-property or index

```js
const listOfAvailableOptions = getChildSchemaSelection(core, schema, "childKey");
```

#### createSchemaOf(data)
Creates a json-schema for the given input-data.

```js
const baseSchema = getTemplate({ target: "" });
// returns {type: "object", properties: { target: "string"}},
```


## Custom extensions

### pattern

For error generation, an attribute `patternExample` may be set for a `pattern` validation. Instead of the regular
expression, the example will be printed in the error message.

### oneOf-flag

In `resolveOneOf.fuzzy.js` For an explicit oneOf resolution the schema may be extended by a `oneOfProperty`-property.
This will always associate an entry with a matching value (instead of schema validation).

Example

```js
const schema = {
    oneOfProperty: "id",
    oneOf: [
        { type: "object", properties: { id: { type: "string", pattern: "^1$" }, title: { type: "number" } } },
        { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } },
        { type: "object", properties: { id: { type: "string", pattern: "^3$" }, title: { type: "number" } } }
    ]
}

const result = resolveOneOf(core, schema, { id: "2", title: "not a number" })
// will always return (even if invalid)
// { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } }
```
