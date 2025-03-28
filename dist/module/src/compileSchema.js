import { errors } from "./errors/errors";
import sanitizeErrors from "./utils/sanitizeErrors";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { getTemplate } from "./getTemplate";
import { getValue } from "./utils/getValue";
import { join, split } from "@sagold/json-pointer";
import { joinId } from "./utils/joinId";
import { mergeNode } from "./mergeNode";
import { omit } from "./utils/omit";
import { isSchemaNode, isJsonError } from "./types";
import { createSchema } from "./createSchema";
import { hasProperty } from "./utils/hasProperty";
const defaultDrafts = [
    { regexp: "draft-04", draft: draft04 },
    { regexp: "draft-06", draft: draft06 },
    { regexp: "draft-07", draft: draft07 },
    { regexp: ".", draft: draft2019 }
];
function getDraft(drafts, $schema) {
    var _a, _b;
    return (_b = (_a = drafts.find((d) => new RegExp(d.regexp).test($schema))) === null || _a === void 0 ? void 0 : _a.draft) !== null && _b !== void 0 ? _b : draft2019;
}
/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(schema, options = {}) {
    var _a, _b, _c;
    const drafts = (_a = options.drafts) !== null && _a !== void 0 ? _a : defaultDrafts;
    const draft = getDraft(drafts, schema === null || schema === void 0 ? void 0 : schema.$schema);
    // # $vocabulary
    // - declares which JSON Schema features (vocabularies) are supported by this meta-schema
    // - each vocabulary is referenced by a URL, and its boolean value indicates whether it is required (true) or optional (false).
    // # allOf
    // - allOf actually includes the rules and constraints from the referenced schemas
    // - allOf pulls in the relevant meta-schema definitions to actually apply them
    // ✅ For validation purposes, you can ignore $vocabulary and rely on allOf to load the necessary meta-schemas.
    // ⚠️ However, if your validator is designed to support multiple versions or optimize processing, $vocabulary provides useful metadata.
    // - Determining Supported Features: Example: A validator could warn or error out if it encounters a vocabulary it does not support.
    // - Selective Parsing or Optimization: Example: If "unevaluatedProperties" is not in a supported vocabulary, your validator should not enforce it.
    // - Future-Proofing for Extensions: Future versions of JSON Schema may add optional vocabularies that aren't explicitly included in allOf.
    if (schema === null || schema === void 0 ? void 0 : schema.$vocabulary) {
        console.log("handle vocabulary", schema.$vocabulary);
        // compile referenced meta schema
        // 1. could validate passed in schema
        // 2. could return a sanitized schema based on validation
        // then add parsers and validators based on meta-schema
    }
    const node = {
        spointer: "#",
        lastIdPointer: "#",
        schemaId: "#",
        reducers: [],
        resolvers: [],
        validators: [],
        schema,
        ...NODE_METHODS
    };
    node.context = {
        remotes: {},
        anchors: {},
        ids: {},
        ...((_b = options.remoteContext) !== null && _b !== void 0 ? _b : {}),
        refs: {},
        rootNode: node,
        version: draft.version,
        features: draft.features,
        templateDefaultOptions: options.templateDefaultOptions,
        drafts
    };
    node.context.remotes[(_c = schema === null || schema === void 0 ? void 0 : schema.$id) !== null && _c !== void 0 ? _c : "#"] = node;
    addFeatures(node);
    return node;
}
// - $ref parses node id and has to execute everytime
// - if is a shortcut for if-then-else and should always parse
// - $defs contains a shortcut for definitions
const whitelist = ["$ref", "if", "$defs"];
const noRefMergeDrafts = ["draft-04", "draft-06", "draft-07"];
function addFeatures(node) {
    if (node.schema.$ref && noRefMergeDrafts.includes(node.context.version)) {
        // for these draft versions only ref is validated
        node.context.features
            .filter(({ keyword }) => whitelist.includes(keyword))
            .forEach((feature) => execFeature(feature, node));
        return;
    }
    const keys = Object.keys(node.schema);
    node.context.features
        .filter(({ keyword }) => keys.includes(keyword) || whitelist.includes(keyword))
        .forEach((feature) => execFeature(feature, node));
}
function execFeature(feature, node) {
    var _a, _b, _c, _d;
    // @todo consider first parsing all nodes
    (_a = feature.parse) === null || _a === void 0 ? void 0 : _a.call(feature, node);
    if ((_b = feature.addReduce) === null || _b === void 0 ? void 0 : _b.call(feature, node)) {
        node.reducers.push(feature.reduce);
    }
    if ((_c = feature.addResolve) === null || _c === void 0 ? void 0 : _c.call(feature, node)) {
        node.resolvers.push(feature.resolve);
    }
    if ((_d = feature.addValidate) === null || _d === void 0 ? void 0 : _d.call(feature, node)) {
        node.validators.push(feature.validate);
    }
}
const DYNAMIC_PROPERTIES = [
    "$ref",
    "$defs",
    "if",
    "then",
    "else",
    "allOf",
    "anyOf",
    "oneOf",
    "dependentSchemas",
    "dependentRequired",
    "definitions",
    "dependencies",
    "patternProperties"
];
export function isReduceable(node) {
    for (let i = 0, l = DYNAMIC_PROPERTIES.length; i < l; i += 1) {
        if (hasProperty(node, DYNAMIC_PROPERTIES[i])) {
            return true;
        }
    }
    return false;
}
const NODE_METHODS = {
    errors,
    compileSchema(schema, spointer = this.spointer, schemaId) {
        const nextFragment = spointer.split("/$ref")[0];
        const parentNode = this;
        const node = {
            lastIdPointer: parentNode.lastIdPointer, // ref helper
            context: parentNode.context,
            parent: parentNode,
            spointer,
            schemaId: schemaId !== null && schemaId !== void 0 ? schemaId : join(parentNode.schemaId, nextFragment),
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            ...NODE_METHODS
        };
        addFeatures(node);
        return node;
    },
    /**
     * Returns a node containing json-schema of a data-json-pointer.
     *
     * To resolve dynamic schema where the type of json-schema is evaluated by
     * its value, a data object has to be passed in options.
     *
     * Per default this function will return `undefined` schema for valid properties
     * that do not have a defined schema. Use the option `withSchemaWarning: true` to
     * receive an error with `code: schema-warning` containing the location of its
     * last evaluated json-schema.
     *
     * Example:
     *
     * ```ts
     * draft.setSchema({ type: "object", properties: { title: { type: "string" } } });
     * const result = draft.getSchema({  pointer: "#/title" }, data: { title: "my header" });
     * const schema = isSchemaNode(result) ? result.schema : undefined;
     * // schema = { type: "string" }
     * ```
     */
    getSchema(pointer, data, options = {}) {
        var _a, _b, _c;
        options.path = (_a = options.path) !== null && _a !== void 0 ? _a : [];
        options.withSchemaWarning = (_b = options.withSchemaWarning) !== null && _b !== void 0 ? _b : false;
        options.pointer = (_c = options.pointer) !== null && _c !== void 0 ? _c : "#";
        const keys = split(pointer);
        if (keys.length === 0) {
            return this.resolveRef(options);
        }
        let currentPointer = "#";
        let node = this;
        for (let i = 0, l = keys.length; i < l; i += 1) {
            currentPointer = `${currentPointer}/${keys[i]}`;
            const nextNode = node.get(keys[i], data, { ...options, pointer: currentPointer });
            if (!isSchemaNode(nextNode)) {
                return nextNode;
            }
            data = getValue(data, keys[i]);
            node = nextNode;
        }
        return node.resolveRef(options);
    },
    getRef($ref) {
        return compileSchema({ $ref }, { remoteContext: this.context }).resolveRef();
    },
    get(key, data, options = {}) {
        var _a, _b, _c;
        options.path = (_a = options.path) !== null && _a !== void 0 ? _a : [];
        options.withSchemaWarning = (_b = options.withSchemaWarning) !== null && _b !== void 0 ? _b : false;
        options.pointer = (_c = options.pointer) !== null && _c !== void 0 ? _c : "#";
        const { path, pointer } = options;
        let node = this;
        if (node.reducers.length) {
            const result = node.reduce({ data, key, path, pointer });
            if (isJsonError(result)) {
                return result;
            }
            if (isSchemaNode(result)) {
                node = result;
            }
        }
        for (const resolver of node.resolvers) {
            const schemaNode = resolver({ data, key, node });
            if (schemaNode) {
                return schemaNode;
            }
        }
        const referencedNode = node.resolveRef({ path });
        if (referencedNode !== node) {
            return referencedNode.get(key, data, options);
        }
        if (options.withSchemaWarning === true) {
            return node.errors.schemaWarning({ pointer, value: data, schema: node.schema, key });
        }
        if (options.createSchema === true) {
            return node.compileSchema(createSchema(getValue(data, key)), `${node.spointer}/additional`, `${node.schemaId}/additional`);
        }
    },
    getTemplate(data, options) {
        const opts = {
            recursionLimit: 1,
            ...this.context.templateDefaultOptions,
            cache: {},
            ...(options !== null && options !== void 0 ? options : {})
        };
        return getTemplate(this, data, opts);
    },
    reduce({ data, pointer, key, path }) {
        const resolvedNode = { ...this.resolveRef({ pointer, path }) };
        // const resolvedSchema = mergeSchema(this.schema, resolvedNode?.schema);
        // const node = (this as SchemaNode).compileSchema(resolvedSchema, this.spointer, resolvedSchema.schemaId);
        const node = mergeNode(this, resolvedNode, "$ref");
        // const node = resolvedNode;
        // @ts-expect-error bool schema
        if (node.schema === false) {
            return node;
            // @ts-expect-error bool schema
        }
        else if (node.schema === true) {
            const nextNode = node.compileSchema(createSchema(data), node.spointer, node.schemaId);
            path === null || path === void 0 ? void 0 : path.push({ pointer, node });
            return nextNode;
        }
        let schema;
        let workingNode = node;
        const reducers = node.reducers;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, key, node, pointer });
            if (isJsonError(result)) {
                return result;
            }
            if (result) {
                // @ts-expect-error bool schema - for undefined & false schema return false schema
                if (result.schema === false) {
                    schema = false;
                    break;
                }
                // compilation result for data of current schemain order to merge results, we rebuild
                // node from schema alternatively we would need to merge by node-property
                workingNode = mergeNode(workingNode, result);
            }
        }
        if (schema === false) {
            console.log("return boolean schema `false`");
            // @ts-expect-error bool schema
            return { ...node, schema: false, reducers: [] };
        }
        if (workingNode !== node) {
            path === null || path === void 0 ? void 0 : path.push({ pointer, node });
        }
        // remove dynamic properties of node
        workingNode.schema = omit(workingNode.schema, ...DYNAMIC_PROPERTIES);
        // @ts-expect-error string accessing schema props
        DYNAMIC_PROPERTIES.forEach((prop) => (workingNode[prop] = undefined));
        return workingNode;
    },
    validate(data, pointer = "#", path = []) {
        // before running validation, we need to resolve ref and recompile for any
        // newly resolved schema properties - but this should be done for refs, etc only
        const node = this;
        path.push({ pointer, node });
        const errors = [];
        // @ts-expect-error untyped boolean schema
        if (node.schema === true) {
            return errors;
        }
        // @ts-expect-error untyped boolean schema
        if (node.schema === false) {
            return [
                node.errors.invalidDataError({
                    value: data,
                    pointer,
                    schema: node.schema
                })
            ];
        }
        for (const validate of node.validators) {
            // console.log("validator", validate.name);
            const result = validate({ node, data, pointer, path });
            if (Array.isArray(result)) {
                errors.push(...result);
            }
            else if (result) {
                errors.push(result);
            }
        }
        return sanitizeErrors(errors);
    },
    addRemote(url, schema) {
        var _a;
        // @draft >= 6
        schema.$id = joinId(schema.$id || url);
        const node = {
            spointer: "#",
            lastIdPointer: "#",
            schemaId: "#",
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            ...NODE_METHODS
        };
        const { context } = this;
        const draft = getDraft(context.drafts, (_a = schema === null || schema === void 0 ? void 0 : schema.$schema) !== null && _a !== void 0 ? _a : this.context.rootNode.$schema);
        node.context = {
            ...context,
            refs: {},
            rootNode: node,
            features: draft.features,
            version: draft.version
        };
        node.context.remotes[joinId(url)] = node;
        addFeatures(node);
        return this;
    },
    resolveRef() {
        throw new Error("required a customized resolveRef function on node");
    },
    toJSON() {
        var _a;
        return { ...this, context: undefined, errors: undefined, parent: (_a = this.parent) === null || _a === void 0 ? void 0 : _a.spointer };
    }
};
