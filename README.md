<h1 align="center"><img src="./docs/json-schema-library.png" width="256" alt="json-schema-library"></h1>

**Customizable and hackable json-validator and json-schema utilities for traversal, data generation and validation**

> This package offers tools and utilities to work with json-schema, create and validate data. Unfortunately, most
> packages, editors or validators do not care to expose basic json-schema functionality. Instead of small memory
> footprint or high performance, this package focuses on exposing utilities for browser and node environments and
> lessens the pain to build custom tools around json-schema.

`npm i json-schema-library -S` or `yarn add json-schema-library -S`


- This package is tested on node v10.16 and in latest Browsers.
- This library currently supports all draft4 features (@see [benchmark](https://github.com/ebdrup/json-schema-benchmark))


1. [Breaking Changes](#breaking-changes)
1. [Overview](#overview)
    1. [Core](#core)
    1. [Add Custom Validators](#add-custom-validators)
1. [Custom Extensions](#custom-extensions)


## Breaking Changes

1. with version `v4.0.0` the api has changed in order to use the defined (root) schema in core as default where 
    possible. This means, most methods have a a changed signature, where `data` is passed before an optional `schema` argument. Check the [Core Overview](#core) for the current signature
2. additionally `iterateSchema` has been renamed to `eachSchema` for consistency


## Overview

Either select an existing __validator__ (`core`) or create your own. Each __Core__ holds all functions that are required
for the json-schema operations like validation. In order to overwrite a custom function you can either

- modify the map-objects (i.e. [/lib/validation/keywords.js](./lib/validation/keyword.js))
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
| each              | data, callback, [schema], [pointer]   | Iterates over the data, passing value and its schema
| getSchema         | pointer, [data], [schema] : Schema    | Get the json-schema describing the `data` found at `pointer`
| getTemplate       | data, [schema] : Mixed                | returns a template object based of the given json-schema
| isValid           | data, [schema], [pointer] : Boolean   | Check if the given schema validates the data
| resolveOneOf      | data, [schema], [pointer] : Schema    | returns the oneOf-schema for the passed data
| resolveRef        | schema : Schema                       | resolves a $ref on a given schema-object
| setSchema         | schema                                | set a new (root) schema
| step              | key, schema, data, [pointer] : Schema | step into a json-schema by the given key (property or index)
| validate          | data, [schema], [pointer] : Array     | Get a list of validation errors


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

##### getSchema(core, pointer, [data], [schema])
> Get the json-schema describing the `data` found at `pointer`.
> The default json-schema-definitions can be resolved without any data as input: `core.getSchema('#/article/title')`. 
> For any dynamic values (like `oneOf`, `definitions`) the data has to be passed in addition.

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const targetSchema = core.getSchema('#/path/to/target', rootData);
```

Currently may also return an error:

```js
if (targetSchema.type === "error") {
    throw new Error(targetSchema.message);
}
```

Or using `getSchema` directly

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const targetSchema = getSchema(core, '#/path/to/target', rootData);
```


##### getTemplate(core, data, [schema])
> Generate data which is valid to the given json-schema. Additionally, a data object may be given, which will be
extended by any missing items or properties.

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core();
const baseData = core.getTemplate(
    { other: true },
    { type: "object", properties: { target: { type: "string", default: "v" } } },
); // returns { other: true, target: "v" }
```

##### validate(core, data, [schema])
> Get a list of validation errors

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const errors = core.validate({ validationOf: "rootSchema" });
// validation errors running data for 'rootSchema'
const customSchemaErrors = core.validate("", { type: "number" });
// returns { type: "TypeError" }
```

##### isValid(core, data, [schema])
> Check if the given schema validates the data

basically `core.validate("", { type: "number" }).length === 0`

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const baseSchema = core.isValid("", { type: "number" });
// returns false
```

##### validateAsync(core, data, [options])
> Asynchronous validation helper

Optional support for onError helper, which is invoked for each error (after being resolved)

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
// signature: Core, data, { onError: [onErrorCallback], schema: JSONSchema, pointer: [Pointer]} : Promise
validateAsync(core, "", { onError: (err) => {}, schema: { type: "number" } })
    .then(allErrors => {});
```

##### step(core, key, schema, data)
> Get the json-schema of a child-property

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const baseSchema = core.step(   
    "target"
    { type: "object", properties: { target: { type: "string" } } },
    { target: "value" }
); // returns {type: "string"}
```

##### each(core, data, callback, [schema])
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
core.each([5, "nine"], (schema, value, pointer) => {
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

#### getChildSchemaSelection(core, key, schema)
Returns a list of possible schemas for the given child-property or index

```js
const listOfAvailableOptions = getChildSchemaSelection(core, "childKey", schema);
```

#### createSchemaOf(data)
Creates a json-schema for the given input-data.

```js
const baseSchema = createSchemaOf({ target: "" });
// returns {type: "object", properties: { target: "string"}},
```

#### eachSchema(schema, callback)
Iterate the schema, invoking the callback function for each type (schema) definition

```js
const baseSchema = eachSchema(schema, (schema, pointer) => {});
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

const result = resolveOneOf(core, { id: "2", title: "not a number" }, schema);
// will always return (even if invalid)
// { type: "object", properties: { id: { type: "string", pattern: "^2$" }, title: { type: "number" } } }
```
