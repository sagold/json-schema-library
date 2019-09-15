/* eslint max-statements-per-line: ["error", { "max": 2 }] */
const eachTypeDef = require("../eachTypeDef");
const remotes = require("../../remotes");
const joinScope = require("./joinScope");
const getRef = require("./getRef");

const COMPILED = "__compiled";
const COMPILED_REF = "__ref";
const GET_REF = "getRef";
const GET_ROOT = "getRoot";
const suffixes = /(#|\/)+$/g;
const domain = /^[^:]+:\/\/[^/]+\//;


function compile(rootSchema, force = true) {
    if (rootSchema[COMPILED] !== undefined) { return rootSchema; } // eslint-disable-line
    const context = { ids: {}, remotes: Object.assign({}, remotes) };
    const rootSchemaAsString = JSON.stringify(rootSchema);
    rootSchema = JSON.parse(rootSchemaAsString);
    Object.defineProperty(rootSchema, COMPILED, { enumerable: false, value: true });
    Object.defineProperty(rootSchema, GET_REF, { enumerable: false, value: getRef.bind(null, context, rootSchema) });
    // Object.defineProperty(rootSchema, "debug", { enumerable: false, value: schema => {
    //     console.log(JSON.stringify(context.ids, null, 2));
    //     console.log("remotes", Object.keys(remotes));
    //     console.log(JSON.stringify(rootSchema, null, 2));
    // } });
    if (force === false && rootSchemaAsString.includes("$ref") === false) {
        // bail early, when no $refs are defined
        return rootSchema;
    }

    const scopes = {};
    const getRoot = () => rootSchema;
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

        if (schema.$ref) {
            Object.defineProperty(schema, COMPILED_REF, { enumerable: false, value: joinScope(scope, schema.$ref) });
            // @todo currently not used:
            Object.defineProperty(schema, GET_ROOT, { enumerable: false, value: getRoot });
            // console.log("compiled ref", scope, schema.$ref, "=>", joinScope(scope, schema.$ref));
        }

        // @todo this will temp fix missing scopes in $ref, but must be resolved with correct scope-id
        const additionalId = scope.replace(domain, "");
        if (context.ids[additionalId] == null) { context.ids[additionalId] = pointer; }
    });

    // console.log(JSON.stringify(context.ids, null, 2));
    return rootSchema;
}


module.exports = compile;
