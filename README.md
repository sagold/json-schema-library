# json-schema-library

**Customizable and hackable json-validator and json-schema utilities for traversal, data generation and validation**

> This package offers tools and utilities to work with json-schema, create and validate data. Unfortunately, most
> packages, editors or validators do not care to expose basic json-schema functionality. Instead of small memory
> footprint or high performance, this package focuses on exposing utilities for browser and node environments and
> lessens the pain to build custom tools around json-schema.

`npm i json-schema-library`.

This package is tested on node v6.9.1.


## Overview

Either select an existing __validator__ (`core`) or create your own. Each __Core__ hold all functions that are required
for the json-schema operations like validation. In order to overwrite a custom function you can either

- modify the map-objects (i.e. [/lib/validation/keywords](./lib/validation/keywords))
- overwrite functions or keys in the generated instance (`const instance = new Core()`)
- Create a custom __Core__ following the examples in [/lib/cores](./lib/cores)

Additionally, helper functions and tools are separately exposed via CommonJS Modules. Most of them do require a
core-object as parameter, but use only some of the functions defined in an core-instance.


### Core

The default interface of a validator can be found in [/lib/cores/CoreInterface](./lib/cores/CoreInterface). It exposes
the following methods

| method            | parameter                         | description
| ----------------- | --------------------------------- | -------------------------------------------------------------
| constructor       | schema                            | pass the root schema in the constructor
| get rootSchema    |                                   | or pass the root schema as property like
| set rootSchema    | rootSchema                        | `instance.rootSchema = require("./json-schema.json")`
| each              | schema, data, callback, [pointer] | Iterates over the data, passing value and its schema
| step              | key, schema, data, [pointer]      | step into a json-schema by the given key (property or index)
| validate          | schema, data, [pointer]           | return a list of errors found validating the data
| isValid           | schema, data, [pointer]           | returns true if the data is validated by the json-schema
| resolveOneOf      | schema, data, [pointer]           | returns the oneOf-schema for the passed data
| resolveRef        | schema                            | resolves a $ref on a given schema-object
| getSchema         | schema, data, [pointer]           | returns the json schema of the given data-json-pointer
| getTemplate       | schema, data                      | returns a template object based of the given json-schema


#### Examples

##### getSchema(core, schema, pointer, data)

return the json 'schema' matching 'data' at 'pointer'. Should be modified to use a step/next-function, which is already
within the logic (advance VS retrieve from root -> support both)

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const targetSchema = getSchema(core, rootSchema, '#/path/to/target', rootData);
```

Currently may also return an error:

```js
if (targetSchema instanceOf Error) {
    throw targetSchema;
}
```

##### getTemplate(core, schema, data, rootSchema = schema)

return data which is valid to the given json-schema. Additionally, a data object may be given, which will be
extended by any missing items or properties.

```js
const baseData = getTemplate(
    { type: "object", properties: { target: { type: "string", default: "v" } } },
    { other: true }
); // returns { other: true, target: "v" }
```

##### validate(data, schema, step)

returns a list of validation errors

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const baseSchema = core.validate({ type: "number" }, "");
// returns false

// alternatively use core.validate({ type: "number" }, "")
```

##### isValid(data, schema, step)

returns true if the given schema validates the data 

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const baseSchema = core.isValid({ type: "number" }, "");
// returns false
```

##### step(key, schema, data, rootSchema = schema)

returns the child schema found at the given key

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const baseSchema = core.step(
    { type: "object", properties: { target: {type: "string"}} },
    { target: "value" }
    "target", 
); // returns {type: "string"}

// alternatively use core.step({ type: "object", properties: { target: {type: "string"}} }, { target: "value" }, "target")
```

##### each(data, schema, callback)

calls the callback on each item (object, array and value), passing the current schema and its data

```js
const rootSchema = {
    type: "array",
    items: [
        { type: "number" },
        { type: "string" }
    ]
};
const core = new require("json-schema-library").core.draft04(rootSchema),
core.each(core.rootSchema, [5, "nine"], (schema, value, pointer) => {
    // 1. schema = { type: "array", items: [...] }, data = [5, "nine"], pointer = #
    // 2. schema = { type: "number" }, data = 5, pointer = #/0
    // 3. schema = { type: "string" }, data = "nine", pointer = #/1
});
```


### Additional helpers

#### SchemaService(schema)

binds the schema to getSchema.

```js
const schemaService = new SchemaService(rootSchema); // default core 'draft04'
const targetSchema = schemaService.get('#/path/to/target', rootData);
```

#### createSchemaOf(data)

returns a json schema which is valid against data.

```js
const baseSchema = getTemplate({ target: "" });
// returns {type: "object", properties: { target: "string"}},
```

