# 06 with poc

> compiled schema results with data only expose the following?

```js
{
  properties: {},
  byPatternOrFallback: [] // pattern, additional
}
```

```js
{
  items: [],
  byPatternOrFallback: []  // additional
}
```

# 05 flow

```js
const cschema = compileSchema(myJsonSchema);

// get resolved json-schema for root data
const schema = cschema.getResolvedSchema(data);
// get original root json-schema
const schema = cschema.getResolvedSchema();

//
const childNode = cschema.step(data, key);
```

# 04

schema

```js
{
  type: "object",
  properties: {
    withHeader: { type: "boolean", default: false }
  }
  if: {
    type: "object",
    properties: {
      withHeader: { const: true }
    }
  },
  then: {
    properties: {
      header: { type: "string" }
    }
  }
}
```

tree

```js

const { schema: node, error } = schema.step(dataOfNode, childKey);

// parent/root
{
  node: "root",
  schema,
  get(data) {
    const children = [];
    // evaluate dynamics
    children.push(...this.children);

    if (draft.isValid(schema.if, data) && schema.then) {
      // merge children with schema.then

    } else if (!draft.isValid(schema.if, data) && schema.else) {
      // merge children with schema.else
    }

    return {
      node: "parent",
      spointer: "/",
      optional: false,
      dynamic: true,
      schema
    }
  },
  children: [{
    node: "leaf",
    key: "withHeader",
    spointer: "/properties/withHeader"
    optional: true,
    dynamic: false,
    schema
  }]
}
```

```js
// object node
{
  node: "parent",
  schema: schema,
  get({ name, value, pointer }) {
    return this.children.find(node => node.key === name) ?? createError(`${name} is not a valid property`);
  }
  children: [{
    node: "leaf",
    key: "withHeader",
    spointer: "/properties/withHeader"
    optional: true,
    dynamic: false,
    schema
  },
  {
    node: "leaf",
    key: "header",
    spointer: "/properties/header",
    optional: true,
    dynamic: true,
    schema
  }]
}
```

# 03

schema

```js
{
  type: "object",
  patternProperties: {
    "title.*": { type: "string" }
  },
  additionalProperties: false
}
```

tree

```js
{
  node: "parent",
  schema: schema,
  get({ name, value, pointer }) {
    for (let i = 0; i < this.patterns.length; i += 1) {
      if (this.patterns[i].test.test(name)) {
        return this.patterns[i].node;
      }
    }
    return createError(`${name} is not a valid property`);
  }
  patterns: [
    {
      test: /title/, {
        node: "leaf",
        spointer: "/patternProperties/title.*"
        schema
    } }
  ],
  children: [{
    node: "leaf",
    key: "title",
    spointer: "/properties/title"
    schema
  }]
}
```

# 02

schema

```js
{
  type: "object",
  properties: {
    title: { type: "string" }
  },
  additionalProperties: false
}
```

tree

```js
{
  node: "parent",
  schema: schema,
  get({ name, value, pointer }) {
    return this.children.find(node => node.key === name) ?? createError(`${name} is not a valid property`);
  }
  children: [{
    node: "leaf",
    key: "title",
    spointer: "/properties/title"
    schema
  }]
}
```

# 01

schema

```js
{
  type: "object",
  properties: {
    title: { type: "string" }
  }
}
```

tree

```js
{
  node: "parent",
  schema: schema,
  get({ name, value, pointer }) {
    return this.children.find(node => node.key === name) ?? createNode(createSchema(value));
  }
  children: [{
    node: "leaf",
    key: "title",
    spointer: "/properties/title"
    schema
  }]
}
```
