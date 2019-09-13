/* eslint max-statements-per-line: ["error", { "max": 2 }] */
const eachTypeDef = require("../eachTypeDef");
const remotes = require("../../remotes");
const gp = require("gson-pointer");

const COMPILED = "__compiled";
const GET_REF = "getRef";
const suffixes = /(#|\/)+$/g;


function get(rootSchema, $ref) {
    $ref = $ref.replace(suffixes, "");
    if (this.remotes[$ref]) {
        return this.remotes[$ref];
    }
    $ref = this.ids[$ref] || $ref;
    return gp.get(rootSchema, $ref);
}


function joinScope(previous, id) {
    if (previous == null && id == null) { return "#"; }
    if (id == null) { return previous.replace(suffixes, ""); }
    if (previous == null) { return id.replace(suffixes, ""); }

    if (id[0] === "#") { return `${previous.replace(suffixes, "")}${id.replace(suffixes, "")}`; }
    return `${previous.replace(suffixes, "")}/${id.replace(suffixes, "")}`;
}


module.exports = function compile(rootSchema) {
    if (rootSchema[COMPILED] !== undefined) { return rootSchema; } // eslint-disable-line
    const context = { ids: {}, remotes: Object.assign({}, remotes) };
    const rootSchemaAsString = JSON.stringify(rootSchema);
    rootSchema = JSON.parse(rootSchemaAsString);
    Object.defineProperty(rootSchema, COMPILED, { enumerable: false, value: true });
    Object.defineProperty(rootSchema, GET_REF, { enumerable: false, value: get.bind(context, rootSchema) });
    if (rootSchemaAsString.includes("$ref") === false) {
        // bail early, when no $refs are defined
        return rootSchema;
    }

    const scopes = {};
    eachTypeDef(rootSchema, (schema, pointer) => {
        if (schema.id) { context.ids[schema.id.replace(suffixes, "")] = pointer; }

        // build up scopes and add them to $ref-resolution map
        pointer = `#${pointer}`.replace(/##+/, "#");
        const previousPointer = pointer.replace(/\/[^/]+$/, "");
        const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
        const previousScope = scopes[previousPointer] || scopes[parentPointer];
        const scope = joinScope(previousScope, schema.id);
        scopes[pointer] = scope;
        if (context.ids[scope] == null) { context.ids[scope] = pointer; }
    });

    // console.log(JSON.stringify(context.ids, null, 2));

    return rootSchema;
};
