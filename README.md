[![Npm package version](https://badgen.net/npm/v/json-schema-library)](https://github.com/sagold/json-schema-library/actions/workflows/ci.yaml) [![CI](https://github.com/sagold/json-schema-library/actions/workflows/ci.yaml/badge.svg)](https://github.com/sagold/json-schema-library/actions/workflows/ci.yaml) ![Types](https://badgen.net/npm/types/json-schema-library)

<h1 align="center">
    <img src="./docs/json-schema-library-10.png" width="192" alt="json-schema-library">
    <br/>
    json-schema-library
</h1>

> **json-schema-library** provides tools and utilities for working with JSON Schema - enabling creation, validation, and schema exploration. Unlike most validators and editors, which hide the inner workings, this library is designed for developers building custom tools around JSON Schema. It runs in both Node and browser environments, prioritizing flexibility and extensibility over minimal memory footprint or raw performance.

---

<div align="center">
    <a href="#overview"><b>Overview</b></a> · <a href="#schemanode-methods"><b>Methods</b></a> · <a href="#draft-customization"><b>Customization</b></a> · <a href="#keyword-extensions"><b>Extensions</b></a> · <a href="#breaking-changes">Breaking Changes</a>
</div>

---

**Quick start**

`npm install json-schema-library`

_json-schema-library_ includes a compileSchema function that converts a JSON Schema into a SchemaNode, which gives you easy-to-use methods for working with the schema.

```ts
import { compileSchema, SchemaNode } from "json-schema-library";
import myJsonSchema from "./myJsonSchema.json";
import myData from "./myData.json";

const schema: SchemaNode = compileSchema(myJsonSchema);
// validate data and collect errors if invalid
const { valid, errors } = schema.validate(myData);
// create data which validates to the compiled JSON Schema
const defaultData = schema.getData();
// access a subschema at a specific JSON Pointer location
const { node, error } = schema.getNode("#/image/title");
node && console.log(node.schema);
```

Per default, `compileSchema` uses the draft-version referenced in `$schema` for _cross-draft_ support. In case $schema is omitted or invalid the latest schema (draft-2020-12) will be used. Customizing draft selection is documented in [draft customization](#draft-customization).

```ts
const schemaNode = compileSchema({ $schema: "draft-07" });
console.log(schemaNode.getDraftVersion()); // draft-07
```

## Overview

### compileSchema

Use `compileSchema` once to turn a JSON Schema into a tree of SchemaNodes. After that, you'll work with individual nodes in the tree. You can also pass an options object to `compileSchema` to customize how the nodes are created.

```ts
type CompileOptions = {
  // set of drafts to use
  drafts: Draft[];
  // a context to share
  remote: SchemaNode;
  // if format-validations should create errors. Defaults to true
  formatAssertion: boolean | "meta-schema";
  // default options for all calls to node.getData()
  getDataDefaultOptions?: {
    // Add all properties (required and optional) to the generated data
    addOptionalProps?: boolean;
    // Remove data that does not match input schema. Defaults to false
    removeInvalidData?: boolean;
    // Set to false to take default values as they are and not extend them. Defaults to true
    extendDefaults?: boolean;
    // Limits how often a $ref should be followed before aborting. Prevents infinite data-structure. Defaults to 1
    recursionLimit?: number;
  };
};
```

With this

```ts
import { compileSchema, draft04, draft06, draft07, draft2019, draft2020 } from "json-schema-library";

// only draft07 is used for all JSON schema
compileSchema(mySchema, { drafts: [draft07] });

// the created node will share a context with `anotherSchemaNode` enabling cross schema ref-resolution
// Note that anotherSchemaNode still uses its own drafts it was compiled with
compileSchema(mySchema, { remote: anotherSchemaNode });

// format validation is disabled
compileSchema(mySchema, { formatAssertion: false });

// for all calls to getData, `addOptionalProps` is `true` per default
compileSchema(mySchema, { getDataDefaultOptions: { addOptionalProps: true } });
```

Details on _drafts_ are documented in [draft customization](#draft-customization).
Details on `getDataDefaultOptions` are documented in [getData](#getData).

### SchemaNode

`compileSchema` builds a tree where each sub-schema becomes its own SchemaNode. Every node in the tree offers the same set of methods.
For example:

```ts
const root = compileSchema(mySchema);
const rootData = root.getData();
const { node: titleNode } = root.getNode("#/image/title");
const titleData = titleNode?.getData();
```

<details><summary>Each node has an identity</summary>

```ts
const titleNode = compileSchema(mySchema).getNode("#/image/title");
console.log(titleNode.evaluationPath); // #/properties/image/properties/title
console.log(titleNode.schemaLocation); // #/properties/image/properties/title
```

- `evaluationPath` refers to the path in schema and is extended by `$ref`, e.g. if image is defined on `$defs`: `#/properties/image/$ref/properties/title`
- `schemaLocation` refers to the absolute path within the schema and will not change, e.g. `#/$defs/properties/title`

</details>

<details><summary>Each node has a reference to its parent node</summary>

The parent-node can be a sub-schema or intermediary node:

```ts
const root = compileSchema(mySchema);
const { node: childNode } = root.getNode("#/image");
assert(root === childNode.parent);
```

</details>

<details><summary>All nodes share a context</summary>

> It is not advised to work on context directly, but it might be useful in some situations

A context is shared across all nodes of a schema

```ts
const root = compileSchema(mySchema);
const { node: childNode } = root.getNode("#/image");
assert(root.context === childNode.context);
```

And some context properties are shared across all schema added as remotes. The property `rootNode` refers to the root-schema for the current node

```ts
const root = compileSchema(mySchema);
const { node: childNode } = root.getNode("#/image");
assert(root === childNode.context.rootNode);
```

Note that rootNodes will change when working across remote schema (using $ref).

</details>

### Draft Support

_json-schema-library_ fully supports all core features of draft versions draft-04, draft-06, draft-07, draft-2019-09 and draft-2020-12. Additionally, most format-validations are supported per default besides the listed format below. You can always override or extend format validation as is documented in [draft customization](#draft-customization).

<details><summary>Overview draft support</summary>

Draft support is defined by running a validator against the official [json-schema-test-suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite).

- Test results for _json-schema-library_ can be inspected in [github actions](https://github.com/sagold/json-schema-library/actions/workflows/ci.yaml)
- A comparison to other validators is listed on [json-schema-benchmark](https://github.com/sagold/json-schema-benchmark)

Please note that these benchmarks refer to validation only. _json-schema-library_ offers tooling outside of validation and strives to be as spec-compliant as possible.

</details>

<details><summary>Overview format validation support</summary>

- **`❌ unsupported formats`** iri, iri-reference, idn-hostname
- **`✅ supported formats`**: date, date-time, date, duration, ecmascript-regex, email, hostname, idn-email, ipv4, ipv6, json-pointer, regex, relative-json-pointer, time, unknown, uri-reference, uri-template, uri, uuid

</details>

## SchemaNode methods

[addRemoteSchema](#addremoteschema) ·
[compileSchema](#compileSchema-1) ·
[createSchema](#createSchema) ·
[getChildSelection](#getchildselection) ·
[getData](#getdata) ·
[getNode](#getnode) ·
[getNodeChild](#getnodechild) ·
[getNodeRef](#getnoderef) ·
[getNodeRoot](#getnoderoot) ·
[reduceNode](#reducenode) ·
[toDataNodes](#todatanodes) ·
[toSchemaNodes](#toschemanodes) ·
[validate](#validate)

</details>

### addRemoteSchema

`addRemoteSchema` lets you add additional schemas that can be referenced by an URL using `$ref`. Use this to combine multiple schemas without changing the actual schema.

Each schema is referenced by their unique `$id` (since draft-06, previously `id`). Usually an `$id` is specified as an url, for example `https://mydomain.com/schema/schema-name` or with a file extension like `https://mydomain.com/schema/schema-name.json`.

On a compiled schema

```ts
const schemaNode = compileSchema({
  $id: "https://sagold.com/local",
  type: "object",
  required: ["character"],
  properties: {
    character: {
      $ref: "https://sagold.com/remote"
    }
  }
});
```

use the exposed method `addRemoteSchema` to add a remote schema for $ref-resolution:

```ts
schemaNode.addRemoteSchema("https://sagold.com/remote", {
  $id: "https://sagold.com/remote",
  title: "A character",
  type: "string",
  minLength: 1,
  maxLength: 1
});
```

**Note** the given _url_ and `$id` on the root schema should match. If `$id` is omitted it will be added from the passed url.

To access the remote schema, add a $ref within your local schema and the remote schema will be resolved automatically:

```ts
schemaNode.validate({ character: "AB" }); // maxLength error
schemaNode.getData({}); // { character: "A" } - default value resolved
// returns remote schema (from compiled local schema):
const { node, error } = schemaNode.getNodeRef("https://sagold.com/remote");
```

**Note** JSON Schema $ref-keyword can become tricky when combined with $ids in sub-schemas. For more details, see [json-schema.org: Structuring a complex schema](https://json-schema.org/understanding-json-schema/structuring.html#base-uri).

<details><summary>Adding remote schema to compileSchema</summary>

It is possible to pass remoteSchema on compileSchema by passing a SchemaNode (with all its remote schemas) in `remote`:

```ts
const remote = compileSchema({
  $id: "https://sagold.com/remote",
  $defs: {
    character: {
      title: "A character",
      type: "string",
      minLength: 1,
      maxLength: 1
    }
  }
});

const schemaNode = compileSchema({ $ref: "https://sagold.com/remote#/defs/character" }, { remote });
```

</details>

<details><summary>Access local subschemas in remote schemas</summary>

You can add a local uri reference to the remote schema by using the `#` separator. The following example resolves hte local path `/$defs/character` in the remote schema `https://sagold.com/remote` throught the combined url:
`https://sagold.com/remote#/$defs/character`

```ts
const schemaNode = compileSchema({
  $id: "https://sagold.com/local",
  $ref: "https://sagold.com/remote#/$defs/character"
});

schemaNode.addRemoteSchema("https://sagold.com/remote", {
  $defs: {
    character: {
      title: "A character",
      type: "string",
      minLength: 1,
      maxLength: 1
    }
  }
});

schemaNode.validate("AB"); // maxLength error
schemaNode.getData("A"); // "A" - default value resolved
// returns remote schema (from compiled local schema):
const { node, error } = schemaNode.getNodeRef("https://sagold.com/remote#/$defs/character");
```

**Note** JSON Pointer are not restricted to `$defs` (definitions), but can reference any subschema. For example:

```ts
const schemaNode = compileSchema({
  $id: "https://sagold.com/local",
  $ref: "https://sagold.com/remote#/properties/character"
});

schemaNode.addRemoteSchema("https://sagold.com/remote", {
  type: "object",
  properties: {
    character: {
      title: "A character",
      type: "string",
      minLength: 1,
      maxLength: 1
    }
  }
});

schemaNode.validate("AB"); // maxLength error
schemaNode.getData("A"); // "A" - default value resolved
// returns remote schema (from compiled local schema):
schemaNode.getNodeRef("https://sagold.com/remote#/properties/character");
```

</details>

### compileSchema

`node.compileSchema` creates a new schema node in the same context as node. With this, the created node will be able to resolve local `$ref` and remote `$ref` correctly. Note, the created schema will not be part of (linked) from any nodes in the schema-tree.

```ts
const someNode = node.compileSchema({ prefixItems: [{ type: "string" }, { $ref: "#/$defs/string" }] });
```

### createSchema

`createSchema` returns a simple JSON Schema for the input data.

```ts
const schemaNode = compileSchema(mySchema);
const schema: JsonSchema = schemaNode.createSchema({ title: "initial value" });
console.log(schema); // { type: "string" }
```

### getChildSelection

`getChildSelection` returns a list of available sub-schemas for the given property. In many cases, a single schema will be returned. For _oneOf_-schemas, a list of possible options is returned. This helper always returns a list of schemas.

```ts
const schemaNode = compileSchema(mySchema);
const schemas: SchemaNode[] = schemaNode.getChildSelection("content");
```

<details><summary>Example</summary>

```ts
import { compileSchema, JsonSchema } from "json-schema-library";

const jsonSchema = compileSchema({
  type: "object",
  properties: {
    content: {
      oneOf: [{ type: "string" }, { type: "number" }]
    }
  }
});

const childNodes: JsonSchema[] = jsonSchema.getChildSelection("content");

expect(childNodes.map((n) => n.schema)).to.deep.equal([{ type: "string" }, { type: "number" }]);
```

</details>

### getData

`getData` creates input data from a JSON Schema that is valid to the schema. Where possible, the JSON Schema `default` property will be used to initially setup input data. Otherwise, the first values encountered (enum values, initial values, etc.) are used to build up the json-data.

```ts
const myData = compileSchema(myJsonSchema).getData();
```

Additionally, you can pass input data. `getData` will then complement any missing values from the schema, while keeping the initial values.

```ts
const myData = compileSchema(myJsonSchema).getData({ name: "input-data" });
```

**Note** If you are using references in your schema, `getData` will only resolve the first _$ref_ in each path, ensuring no infinite data structures are created. In case the limit of **1** _$ref_ resolution is too low, you can modify the value globally one by adjusting the json-schema-library settings:

```ts
const myData = compileSchema(myJsonSchema).getData(inputData, { recursionLimit: 2 });
```

<details><summary>Example</summary>

```ts
import { compileSchema, JsonSchema } from "json-schema-library";

const myJsonSchema: JsonSchema = {
  type: "object",
  required: ["name", "option", "list"],
  properties: {
    name: { type: "string" },
    option: {
      type: "string",
      enum: ["first-option", "second-option"]
    },
    list: {
      type: "array",
      items: {
        type: "string",
        default: "new item"
      },
      minItems: 1
    }
  }
};

const schemaNode = new compileSchema(myJsonSchema);
const myData = schemaNode.getData();

expect(myData).to.deep.equal({
  name: "",
  option: "first-option",
  list: ["new item"]
});
```

</details>

<details><summary>Example with input data</summary>

```ts
import { compileSchema, JsonSchema } from "json-schema-library";

const myJsonSchema: JsonSchema = {
  type: "object",
  required: ["name", "option", "list"],
  properties: {
    name: { type: "string" },
    option: {
      type: "string",
      enum: ["first-option", "second-option"]
    },
    list: {
      type: "array",
      items: {
        type: "string",
        default: "new item"
      },
      minItems: 1
    }
  }
};

const jsonSchema = compileSchema(myJsonSchema);
const myData = jsonSchema.getData({ name: "input-data", list: [] });

expect(myData).to.deep.equal({
  name: "input-data",
  option: "first-option",
  list: ["new item"]
});
```

</details>

<details><summary>Option: extendDefaults (default: false)</summary>

Per default, `getData` does try to create data that is valid to the json-schema. Example: array-schemas with `minItems: 1` will add one item to fullfil the validation criteria. You can use the option and pass `{ extendDefaults: false }` to override this behaviour with a default value:

```ts
import { compileSchema } from "json-schema-library";

const myJsonSchema = {
  type: "array",
  default: [], // if omitted will add an array item
  items: {
    type: "string",
    enum: ["one", "two"]
  },
  minItems: 1 // usually adds an enty, but default states: []
};

const myData = compileSchema(myJsonSchema).getData(undefined, { extendDefaults: false });

expect(myData).to.deep.equal([]);
```

</details>

<details><summary>Option: addOptionalProps (default: false)</summary>

`getData` will only add required properties per default:

```ts
const data = compileSchema({
  required: ["title"],
  properties: {
    title: { type: "string" },
    subTitle: { type: "string", default: "sub-title" }
  }
}).getData(undefined);
console.log(data); // { title: "" }
```

With `addOptionalProps:true`, `getData` will also add all optional properties

```ts
const data = compileSchema({
  required: ["title"],
  properties: {
    title: { type: "string" },
    subTitle: { type: "string", default: "sub-title" }
  }
}).getData(undefined, { addOptionalProps: true });
console.log(data); // { title: "", subTitle: "sub-title" }
```

</details>

<details><summary>Option: removeInvalidData (default: false)</summary>

With `removeInvalidData:true`, `getData` will remove data that is invalid to the given schema;

```ts
const data = compileSchema({
  properties: { valid: { type: "string" } },
  additionalProperties: false
}).getData({ valid: "stays", invalid: "removed" }, { removeInvalidData: true });
console.log(data); // { valid: "stays" }
```

`removeInvalidData:true` will _not_ remove data that is valid, but unspecified:

```ts
const data = compileSchema({
  properties: { valid: { type: "string" } },
  additionalProperties: true
}).getData({ valid: "stays", invalid: "removed" }, { removeInvalidData: true });
console.log(data); // { valid: "stays", invalid: "removed" }
```

</details>

<details><summary>Option: useTypeDefaults (default: true)</summary>

With `useTypeDefaults:true`, `getData` will return initial values for all primitives (non-objects/arrays) that do not have a default-property set:

```ts
const data = compileSchema({
  required: ["valid"],
  properties: { valid: { type: "string" } }
}).getData(null, { useTypeDefaults: true });
console.log(data); // { valid: "" }
```

Setting `useTypeDefaults:false` will _not_ remove data that is valid, but unspecified:

```ts
const data = compileSchema({
  required: ["valid"],
  properties: { valid: { type: "string" } }
}).getData(null, { useTypeDefaults: false });
console.log(data); // {}
```

**Note** object and array-properties will still be added if required:

```ts
const data = compileSchema({
  required: ["valid"],
  properties: { valid: { type: "object" } }
}).getData(null, { useTypeDefaults: true });
console.log(data); // { valid: {} }
```

**Note** enforced array-items will be `undefined` if required and `initialValues: false`

```ts
const data = compileSchema({
  required: ["valid"],
  properties: { valid: { type: "array", items: { type: "string" }, minItems: 1 } }
}).getData(null, { useTypeDefaults: false });
console.log(data); // { valid: [undefined] }
```

</details>

### getNode

`getNode` returns the JSON Schema from data location specified by a JSON Pointer. In many cases the JSON Schema can be retrieved without passing any data, but in situations where the schema is dynamic (for example in _oneOf_, _dependencies_, etc.), input-data is required or `getNode` will return a _JsonError_ as is done when the JSON Pointer path is invalid.

```ts
const { node, error } = compileSchema(mySchema).getNode("/list/1/name", myData);
if (node) console.log(node.schema);
```

**Note** `getNode` will return a `node=undefined` for paths that lead to valid properties, but miss a schema definition. For example:

```ts
const { node, error } = compileSchema({ type: "object" }).getNode("/name");
console.log(node, error); // undefined, undefined
```

In case this is unwanted behaviour, use the `withSchemaWarning` option to return a json-error with code `schema-warning` instead:

```ts
const schemaNode = compileSchema({ type: "object" });
const { node, error } = schemaNode.getNode("/name", undefined, { withSchemaWarning: true });
console.log(node?.schema, error); // undefined, { type: "error", code: "schema-warning" }
```

Or set `getNode` to return a simple JSON Schema for the found data setting `createSchema: true`:

```ts
const schemaNode = compileSchema({ type: "object" });
const { node, error } = schemaNode.getNode("/name", { name: 123 }, { createSchema: true });
console.log(node?.schema, error); // { type: "number" }, undefined
```

<details><summary>Example</summary>

```ts
import { compileSchema } from "json-schema-library";

const mySchema = {
  type: "object",
  properties: {
    list: {
      type: "array",
      items: {
        oneOf: [
          {
            type: "object",
            required: ["name"],
            properties: {
              name: {
                type: "string",
                title: "name of item"
              }
            }
          },
          {
            type: "object",
            required: ["description"],
            properties: {
              description: {
                type: "string",
                title: "description of item"
              }
            }
          }
        ]
      }
    }
  }
};

const { node } = compileSchema(mySchema).getNode("/list/1", {
  list: [{ description: "..." }, { name: "my-item" }]
});

expect(node.schema).to.deep.equal({
  type: "object",
  required: ["name"],
  properties: {
    name: {
      type: "string",
      title: "name of item"
    }
  }
});
```

</details>

<details><summary>Evaluating errors</summary>

All returned json-errors have a data property with the following properties

- `pointer` JSON Pointer to the location where the error occured. In case of omitted data, this is the last JSON Schema location that could be resolved
- `schema` the JSON Schema of the last resolved location and the source of the error
- `value` the data value at this location that could not be resolved

```ts
const { error } = schemaNode.getNode("/list/1");
if (error) {
  console.log(Object.keys(error.data)); // [pointer, schema, value]
}
```

</details>

<details><summary>About JsonPointer</summary>

**[JSON Pointer](https://tools.ietf.org/html/rfc6901)** defines a string syntax for identifying a specific value within a Json document and is [supported by Json-Schema](https://json-schema.org/understanding-json-schema/structuring.html). Given a Json document, it behaves similar to a [lodash path](https://lodash.com/docs/4.17.5#get) (`a[0].b.c`), which follows JS-syntax, but instead uses `/` separators (e.g., `a/0/b/c`). In the end, you describe a path into the Json data to a specific point.

</details>

### getNodeChild

`getNodeChild` retrieves the SchemaNode of a child property or index. Using `get` it is possible to incrementally go through the data, retrieving the schema for each next item.

```ts
const mySchema = { type: "object", properties: { title: { type: "string" } } };
const root = compileSchema(mySchema);
const { node } = root.getNodeChild("title", { title: "value" });
if (node == null) return;
console.log(node.schema);
```

<details><summary>Example</summary>

```ts
import { compileSchema, JsonSchema } from "json-schema-library";

const root = compileSchema(mySchema);
const localSchema: JsonSchema = {
  oneOf: [
    {
      type: "object",
      properties: { title: { type: "string" } }
    },
    {
      type: "object",
      properties: { title: { type: "number" } }
    }
  ]
};

const schema = root.getNodeChild("title", { title: 4 }).node?.schema;

expect(schema).to.deep.eq({ type: "number" });
```

</details>

### getNodeRef

`getNodeRef` retrieves the SchemaNode of a `$ref` string.

```ts
const root = compileSchema(mySchema);
root.addRemoteSchema("https://remote.com/schema", remoteSchema);

root.getNodeRef("#/$defs/title"); // title-schema of mySchema
root.getNodeRef("https://remote.com/schema"); // remoteSchema
```

### getNodeRoot

`getNodeRoot` returns the rootNode containing the initial JSON Schema

```ts
const root = compileSchema(mySchema);
const { node } = root.getNode("/image/title");

if (node) {
  assert(node.getNodeRoot() === root); // success
}
```

</details>

### reduceNode

`reduceNode` compiles dynamic JSON schema keywords of a SchemaNode according to the given data.
This utility helps walking down the schema-tree with a set of data and it helps getting a mostly
complete json-schema for a specific data-value.

```ts
const { node: reducedNode } = compileSchema({
    properties: {
        trigger: { type: "boolean"}
    }
    dependentSchemas: {
        trigger: {
            required: ["title"],
            properties: {
                title: { type: "string" }
            }
        }
    }
}).reduceNode({ trigger: true });

expect(reducedNode.schema).to.deep.eq({
    required: ["title"],
    properties: {
        trigger: { type: "boolean"},
        title: { type: "string" }
    }
});
```

> ⚠️ Please be aware that certain schema-definitions are lost when resolving or merging sub-schemas.
> This mainly refers to validation-properties, but also some ambigiuous schema might get overriden.

### toDataNodes

`toDataNodes` collects all data-items (_object_, _array_ and _value_) and their SchemaNode and return them as a list of **DataNodes**:

```ts
type DataNode = { pointer: string; value: unknown; node: SchemaNode };
const schemaNode = compileSchema(mySchema);
const nodes: DataNode[] = schemaNode.toDataNodes(myData);
```

<details><summary>Example</summary>

```ts
import { compileSchema, JsonSchema, JsonPointer } from "json-schema-library";

const mySchema: JsonSchema = {
  type: "array",
  items: [{ type: "number" }, { type: "string" }]
};

const schemaNode = compileSchema(mySchema);
schemaNode.toDataNodes([5, "nine"]).map((dataNode) => ({
  schema: dataNode.node.schema,
  value: dataNode.value,
  pointer: dataNode.pointer
}));

expect(calls).to.deep.equal([
  { schema: mySchema, value: [5, "nine"], pointer: "#" },
  { schema: { type: "number" }, value: 5, pointer: "#/0" },
  { schema: { type: "string" }, value: "nine", pointer: "#/1" }
]);
```

</details>

### toSchemaNodes

`toSchemaNodes` collects all sub-schema definitions, like in `properties["property"]`, `anyOf[1]`, `contains`, `$defs["name"]`, etc. and returns them as a list of **SchemaNodes**:

```ts
const nodes: SchemaNode[] = compileSchema(mySchema).toSchemaNodes();
```

<details><summary>Example</summary>

```ts
import { compileSchema, JsonSchema, SchemaNode } from "json-schema-library";

const mySchema: JsonSchema = {
  type: "array",
  items: {
    oneOf: [{ type: "number" }, { $ref: "#/$defs/value" }]
  },
  $defs: {
    value: { type: "string" },
    object: { type: "object" }
  }
};

const nodes = compileSchema(mySchema)
  .toSchemaNodes(myCallback)
  .map((node) => node.schema);

expect(calls).to.deep.equal([
  mySchema,
  { oneOf: [{ type: "number" }, { $ref: "#/$defs/value" }] },
  { type: "number" },
  { $ref: "#/$defs/value" },
  { type: "string" },
  { type: "object" }
]);
```

</details>

### validate

`validate` is a complete _JSON Schema validator_ for your input data. Calling _validate_ will return a list of validation errors for the passed data.

```ts
const { valid, errors } = compileSchema(myJsonSchema).validate(myData);
// { valid: boolean, errors: JsonError[] }
```

<details><summary>About type JsonError</summary>

In _json-schema-library_ all errors are in the format of a `JsonError`:

```ts
type JsonError = {
  type: "error";
  code: string;
  message: string;
  data?: { [p: string]: any };
};
```

In almost all cases, a JSON Pointer is given on _error.data.pointer_, which points to the source within data where the error occured. For more details on how to work with errors, refer to section [custom errors](#extending-a-draft).

</details>

<details><summary>Example</summary>

```ts
const myJsonSchema: JsonSchema = { type: "object", additionalProperties: false };

const { errors } = compileSchema(myJsonSchema).validate({ name: "my-data" });

expect(errors).to.deep.equal([
  {
    type: "error",
    code: "no-additional-properties-error",
    message: "Additional property `name` in `#` is not allowed",
    data: { property: "name", properties: [], pointer: "#" }
  }
]);
```

</details>

You can also use async validators to validate data with json-schema. For this, another property asyncErrors is exposed on validate:

```ts
const { errorsAsync } = compileSchema(myJsonSchema).validate(myData);

if (errorsAsync.length > 0) {
  const additionalErrors = (await Promise.all(errorsAsync)).filter((err) => err != null);
}
```

Per default _json-schema-library_ does not contain async validators, so `errorsAsync` is always empty. If you add async validators, a list of `Promise<JsonError|undefined>` is return and you need to resolve and filter non-errors (undefined) yourself.

> **Note** `isValid` only refers to errors. `errorsAsync` has to be evaluated separately

<details><summary>Example Async Validation</summary>

```ts
import { JsonSchemaValidator, draft2020 } from "json-schema-library";
// return Promise<JsonError>
const customValidator: JsonSchemaValidator = async ({ node, pointer, data }) => {
  return node.createError("type-error", {
    schema: {},
    pointer,
    value: data
  });
};

const draftList = [
  extendDraft(jsonEditorDraft, {
    keywords: {
      custom: customValidator
    }
  })
];

const { isValid, errorsAsync } = compileSchema({ custom: true }).validate("data");
console.log(isValid, errors.length); // true, 0

const errors = await Promise.all(errorsAsync);
console.log(errors); /// [{ code: "type-error", value: "data", pointer: "#", ... }]
```

</details>

## Draft Customization

[**Extending a Draft**](#extending-a-draft) · [**Keyword**](#keyword)

_json-schema-library_ uses the concept of **drafts** to support different versions of the JSON Schema specification — such as Draft 04, Draft 07, or 2020-12 — and to allow customization of schema behavior.

Each **draft** describes how a schema should be parsed, validated, and interpreted. Drafts can also be extended or modified to change or enhance behavior, such as:

- Replacing or adding new keywords (`oneOf`, `if/then`, custom ones, etc.)
- Defining or overriding format validators (`format: "email"`, etc.)
- Customizing or localizing error messages
- Tweaking how schema nodes behave during parsing or resolution

Out of the box, the library exports all compliant JSON Schema drafts:

```ts
import { draft04, draft06, draft07, draft2019, draft2020 } from "json-schema-library";
```

When you compile a schema, the library will automatically select the correct draft based on the `$schema` field — or fall back to the last draft in the list:

```ts
compileSchema(schema, { drafts: [draft04, draft07, draft2020] });
```

A `Draft` is an object that defines the core behavior and extensions for a schema. It includes:

```ts
type Draft = {
  $schemaRegEx: string;
  version: DraftVersion;
  keywords: Keyword[];
  errors: ErrorConfig;
  formats: typeof formats;
  methods: {};
};
```

Here’s a breakdown of what each piece does:

**`$schemaRegEx`**

A regex string that identifies whether a draft should be used for a given schema, based on the `$schema` property. For example:

```ts
draft.$schemaRegEx === "draft[-/]2020-12";
// matches "$schema": "https://json-schema.org/draft/2020-12/schema"
// matches "$schema": "draft-2020-12"
```

When compiling, drafts are matched from left to right — the first one that matches is used. If no match is found, the **last draft** in the list is used as a fallback. If you're only using one draft, the `$schemaRegEx` check is skipped.

**`version`**

Describes the draft version (e.g., `"2020-12"`). This is mostly used for debugging and logging.

**`keywords`**

A list of keyword handlers for that draft, such as `properties`, `allOf`, `oneOf`, `$ref`, and more. Each keyword defines how the library should parse and validate that keyword. You can override, extend, or remove any keyword.
Learn more in [Keyword](#keyword).

**`errors`**

An object mapping error types to either template strings or error functions. These can be used to customize error messages globally or define more intelligent error generation logic.

**`formats`**

An object mapping format names (like `"email"`, `"uuid"`, `"date-time"`) to custom validation functions. You can override or add formats depending on your needs.

**`methods`**

Draft-specific implementations for certain core behaviors in `SchemaNode`, such as how child schemas are selected or how schemas are converted to data nodes. These can be overridden in custom drafts if needed.

<details><summary>Available methods</summary>

```ts
createSchema: typeof createSchema;
getChildSelection: typeof getChildSelection;
getData: typeof getData;
toDataNodes: typeof toDataNodes;
```

</details>

### Extending a Draft

You may want to extend a draft when the default JSON Schema behavior does not fit your needs. Whether you want to add new keywords, modify error messages, or define custom formats for your validation, `extendDraft` helps you adjust the draft version to meet your specific requirements.

Examples:

```ts
import { extendDraft, draft2020, oneOfFuzzyKeyword, createCustomError, render, ErrorData } from "json-schema-library";

const myDraft = extendDraft(draft2020, {
  // Match all $schema
  $schemaRegEx: "",

  // Register a custom "oneOf" keyword, replacing the existing one
  keywords: [oneOfFuzzyKeyword],

  formats: {
    // Add a new "format": "test", which returns an error when the value is "test"
    test: ({ data, node, pointer }) => {
      if (data === "test") {
        return node.createError("test-error", {
          schema: node.schema,
          pointer: pointer,
          value: data,
          customValue: "test"
        });
      }
    }
  },

  errors: {
    // Add a new custom error "test-error"
    "test-error": "Test error for value {{value}} - {{customValue}}",

    // Overwrite the existing MaxLengthError message
    "max-length-error": "Too many characters",

    // Add a dynamic MinLengthError with custom logic
    "min-length-error": (data: ErrorData) => {
      if (data.minLength === 1) {
        return {
          type: "error",
          code: "min-length-one-error",
          message: "Input is required",
          data
        };
      }
      return {
        type: "error",
        code: "min-length-error",
        message: render("Value in `{{pointer}}` is `{{length}}`, but should be `{{minimum}}` at minimum", data),
        data
      };
    }
  }
});
```

### Overwrite a format validator

The built-in format validators may not always align with your specific requirements. For instance, you might need to validate the output of an `<input type="time" />`, which produces values in formats like `HH:MM` or `HH:MM:SS`. In such cases, you can customize or overwrite the format validators to suit your needs using `extendDraft`

<details>
<summary>Example of overwriting a format validator</summary>

```ts
import { extendDraft, draft2020 } from "json-schema-library";

/**
 * A Regexp that extends http://tools.ietf.org/html/rfc3339#section-5.6 spec.
 * The specification requires seconds and timezones to be a valid date format.
 *
 * matchTimeSecondsAndTimeOptional matches:
 * - HH:MM:SSz
 * - HH:MM:SS(+/-)HH:MM
 * - HH:MM:SS
 * - HH:MMz
 * - HH:MM(+/-)HH:MM
 * - HH:MM
 */
const matchTimeSecondsAndTimeOptional =
  /^(?<time>(?:([0-1]\d|2[0-3]):[0-5]\d(:(?<second>[0-5]\d|60))?))(?:\.\d+)?(?<offset>(?:z|[+-]([0-1]\d|2[0-3])(?::?[0-5]\d)?)?)$/i;

const customTimeFormatDraft = extendDraft(draft2020, {
  formats: {
    // This example extends the default time formatter which validates against RFC3339
    time: ({ node, pointer, data }) => {
      const { schema } = node;
      if (typeof data !== "string" || data === "") {
        return undefined;
      }

      // Use the Custom Regex to validate the date and time.
      const matches = data.match(matchTimeSecondsAndTimeOptional);
      if (!matches) {
        return node.createError("format-date-time-error", { value: data, pointer, schema });
      }

      // leap second
      if (matches.groups.second === "60") {
        // Omitted the code here for brevity.
      }

      return undefined;
    }
  }
});

const { errors, valid } = compileSchema(
  {
    type: "string",
    format: "time",
    $schema: "https://json-schema.org/draft/2020-12/schema"
  },
  { drafts: [customTimeFormatDraft] }
).validate("15:31:12");

console.assert(valid, errors.at(0)?.message);
```

</details>

### Keyword

**Keywords** hold the main logic for JSON Schema functionality. Each `Keyword` corresponds to a JSON Schema keyword like `properties`, `prefixItems`, `oneOf`, etc and offers implementations to `parse`, `validate`, `resolve` and `reduce`. Note that support for each implementation is optional, dependending on the feature requirements. The main properties of a `Keyword`:

- a `Keyword` is only processed if the specified `keyword` is available as property on the JSON Schema
- an optional `order` property may be added as order of keyword execution is sometimes important (`additionalItems` last, `$ref` evaluation first)
- the list of keywords is unique by property-value `keyword`
- for a given function `addX`, a function `X` must be present

```ts
type Keyword = {
  id: string;
  keyword: string;
  order?: number;
  parse?: (node: SchemaNode) => void;
  addResolve?: (node: SchemaNode) => boolean;
  resolve?: JsonSchemaResolver;
  addValidate?: (node: SchemaNode) => boolean;
  validate?: JsonSchemaValidator;
  addReduce?: (node: SchemaNode) => boolean;
  reduce?: JsonSchemaReducer;
};
```

For examples on keyword implementations refer to [./src/keywords](./src/keywords).

**parse**

`parse` will be executed on compile time, usually to add a compiled sub-schema on the parent-node.

<details><summary>Example of keyword using parse</summary>

```ts
export const notKeyword: Keyword = {
  id: "not",
  keyword: "not",
  parse: parseNot
};

export function parseNot(node: SchemaNode) {
  const { schema, evaluationPath, schemaLocation } = node;
  if (schema.not != null) {
    node.not = node.compileSchema(schema.not, `${evaluationPath}/not`, `${schemaLocation}/not`);
  }
}
```

</details>

**resolve**

A resolver returns a child-schema for a property-key, item-index or undefined if the key does not apply.

<details><summary>Example of keyword using resolve</summary>

```ts
export const propertiesKeyword: Keyword = {
  id: "property",
  keyword: "properties",
  parse: parseProperties,
  addResolve: (node: SchemaNode) => node.properties != null,
  resolve: propertyResolver
};

function propertyResolver({ node, key }: JsonSchemaResolverParams) {
  return node.properties?.[key];
}
```

</details>

**reduce**

A reducer replaces the JSON Schema keyword to a simple, static JSON Schema based on the current data

<details><summary>Example of keyword using reduce</summary>

```ts
export const typeKeyword: Keyword = {
  id: "type",
  keyword: "type",
  addReduce: (node) => Array.isArray(node.schema.type),
  reduce: reduceType,
  addValidate: ({ schema }) => schema.type != null,
  validate: validateType
};

function reduceType({ node, pointer, data }: JsonSchemaReducerParams): undefined | SchemaNode {
  const dataType = getJsonSchemaType(data, node.schema.type);
  if (dataType !== "undefined" && Array.isArray(node.schema.type) && node.schema.type.includes(dataType)) {
    return node.compileSchema({ ...node.schema, pointer, type: dataType }, node.evaluationPath);
  }
  return undefined;
}
```

</details>

Currently **keywords** are not exposed per default. You can still access any keyword implementation by retrieving them from a draft:

```ts
import { draft07 } from "json-schema-library";
const dependentSchemasKeyword = draft2020.keywords.find((f) => f.keyword === "dependentSchemas");
```

## Keyword extensions

### oneOfProperty

For `oneOf` resolution, JSON Schema states that data is valid if it validates against exactly one of those sub-schemas. In some scenarios this is unwanted behaviour, as the actual `oneOf` schema is known and only validation errors of this exact sub-schema should be returned.

For an explicit `oneOf` resolution, the JSON Schema may be extended by a property `oneOfProperty`. This will always associate an entry with a matching value (instead of schema validation) and return only this schema or validation errors, depending on the current task. For example:

```ts
const schema = {
  oneOfProperty: "id",
  oneOf: [
    {
      type: "object",
      properties: { id: { const: "1" }, title: { type: "number" } }
    },
    {
      type: "object",
      properties: { id: { const: "2" }, title: { type: "number" } }
    },
    {
      type: "object",
      properties: { id: { const: "3" }, title: { type: "number" } }
    }
  ]
};

const resolvedNode = compileSchema(schema).reduce({ id: "2", title: "not a number" });

// will always return (even if invalid)
expect(resolvedNode?.schema).to.deep.eq({
  type: "object",
  properties: { id: { const: "2" }, title: { type: "number" } }
});
```

### oneOfFuzzyKeyword

If you're working with complex schemas that use the `oneOf` keyword to validate multiple options, `oneOfFuzzyKeyword` offers an alternative approach. It scores the schemas to return the best match, even if none of the schemas fully validate the input data. This makes error messages more readable and helps identify the most appropriate schema when multiple options exist.

`oneOfFuzzyKeyword` helps when no schema fully validates the data but you want to prioritize schemas based on how well they fit the input. This makes it easier to interpret validation results for complex conditions.

`oneOfFuzzyKeyword` is exposed by _json-schema-library_ and can be used to extend any draft.

```ts
import { extendDraft, oneOfFuzzyKeyword, draft2020 } from "json-schema-library";

const myDraft = extendDraft(draft2020, {
  keywords: [oneOfFuzzyKeyword]
});
```

### errorMessages

You can set custom errors messages locally by using the errors-keyword:

```ts
const { errors } = compileSchema({
  type: "array",
  minItems: 2,
  errorMessages: {
    "min-items-error": "Custom error {{minItems}}"
  }
}).validate([1]);

assert.deepEqual(errors[0].message, "Custom error 2");
```

### regexFlags

In order to allow customization of regular expressions a schema property `regexFlags` is supported for `pattern`, `patternProperties` and format `regex`:

```ts
const { errors } = compileSchema({
  type: "string",
  pattern: "^[a-zA-Z0-9+_.-]+",
  regexFlags: "v"
}).validate("-");
```

Per default, a regexFlags `"u"` is used. To change this setting globally, change `REGEX_FLAGS` in settings:

```ts
import settings from "json-schema-library";

settings.REGEX_FLAGS = "v";
```

## Breaking Changes

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
