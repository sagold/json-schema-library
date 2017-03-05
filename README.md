# json-schema-library

**Customizable and hackable json-validator and json-schema utilities for traversal, data generation and validation**

> This package offers tools and utilities to work with json-schema, create and validate data. Unfortunately, most
> packages, editors or validators do not care to expose basic json-schema functionality. Instead of small memory
> footprint or high performance, this package focuses on exposing utilities for browser and node environments and
> lessens the pain to build custom tools around json-schema.

`npm i json-schema-library`.

This package is tested on node v6.9.1.


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

| method            | parameter                         | description
| ----------------- | --------------------------------- | -------------------------------------------------------------
| constructor       | schema                            | pass the root schema in the constructor or add it on rootSchema
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
Returns the json 'schema' matching 'data' at 'pointer'. Should be modified to use a step/next-function, which is already
within the logic (advance VS retrieve from root -> support both)

```js
const core = new require("json-schema-library").core.draft04(rootSchema),
const targetSchema = getSchema(core, rootSchema, '#/path/to/target', rootData);
```

Currently may also return an error:

```js
if (targetSchema.type === "error") {
    throw targetSchema;
}
```

##### getTemplate(core, schema, data, rootSchema = schema)
Returns data which is valid to the given json-schema. Additionally, a data object may be given, which will be
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
Validate data and get a list of validation errors

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const errors = core.validate({ type: "number" }, "");
// returns { type: "TypeError" }
```

##### isValid(core, data, schema, step)
Return true if the given schema validates the data 

```js
const Core = require("json-schema-library").cores.Draft04;
const core = new Core(rootSchema);
const baseSchema = core.isValid({ type: "number" }, "");
// returns false
```

##### step(core, key, schema, data, rootSchema = schema)
Get the child schema of a property or index

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
Iterate over each item (object, array and value), passing each value and its corresponding schema

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

