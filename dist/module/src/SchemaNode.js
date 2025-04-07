import copy from "fast-copy";
import sanitizeErrors from "./utils/sanitizeErrors";
import settings from "./settings";
import { createSchema } from "./methods/createSchema";
import { dashCase } from "./utils/dashCase";
import { eachSchema } from "./methods/eachSchema";
import { getValue } from "./utils/getValue";
import { isJsonError } from "./types";
import { isObject } from "./utils/isObject";
import { join, split } from "@sagold/json-pointer";
import { joinId } from "./utils/joinId";
import { mergeNode } from "./mergeNode";
import { omit } from "./utils/omit";
import { pick } from "./utils/pick";
import { render } from "./errors/render";
import { validateNode } from "./validateNode";
const { DYNAMIC_PROPERTIES } = settings;
export function isSchemaNode(value) {
    return isObject(value) && Array.isArray(value === null || value === void 0 ? void 0 : value.reducers) && Array.isArray(value === null || value === void 0 ? void 0 : value.resolvers);
}
function getDraft(drafts, $schema) {
    var _a;
    return (_a = drafts.find((d) => new RegExp(d.$schemaRegEx).test($schema))) !== null && _a !== void 0 ? _a : drafts[drafts.length - 1];
}
export const SchemaNodeMethods = {
    /** Compiles a child-schema of this node to its context */
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
            ...SchemaNodeMethods
        };
        addKeywords(node);
        return node;
    },
    createError(name, data, message) {
        let errorMessage = message;
        if (errorMessage === undefined) {
            const error = this.context.errors[name];
            if (typeof error === "function") {
                return error(data);
            }
            errorMessage = render(error !== null && error !== void 0 ? error : name, data);
        }
        return { type: "error", name, code: dashCase(name), message: errorMessage, data };
    },
    createSchema,
    each(data, callback, pointer) {
        const node = this;
        return node.context.methods.each(node, data, callback, pointer);
    },
    eachSchema(callback) {
        const node = this;
        return eachSchema(node, callback);
    },
    getChildSchemaSelection(property) {
        const node = this;
        return node.context.methods.getChildSchemaSelection(node, property);
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
        const node = this;
        const keys = split(pointer);
        if (keys.length === 0) {
            const result = node.resolveRef(options);
            return isJsonError(result) ? { node: undefined, error: result } : { node: result, error: undefined };
        }
        let currentPointer = "#";
        let currentNode = node;
        for (let i = 0, l = keys.length; i < l; i += 1) {
            currentPointer = `${currentPointer}/${keys[i]}`;
            const nextNode = currentNode.get(keys[i], data, { ...options, pointer: currentPointer });
            if (!isSchemaNode(nextNode)) {
                return { node: undefined, error: nextNode };
            }
            data = getValue(data, keys[i]);
            currentNode = nextNode;
        }
        const result = currentNode.resolveRef(options);
        return isJsonError(result) ? { node: undefined, error: result } : { node: result, error: undefined };
    },
    getRef($ref) {
        const node = this;
        return node.compileSchema({ $ref }).resolveRef();
    },
    get(key, data, options = {}) {
        var _a, _b, _c;
        options.path = (_a = options.path) !== null && _a !== void 0 ? _a : [];
        options.withSchemaWarning = (_b = options.withSchemaWarning) !== null && _b !== void 0 ? _b : false;
        options.pointer = (_c = options.pointer) !== null && _c !== void 0 ? _c : "#";
        const { path, pointer } = options;
        let node = this;
        if (node.reducers.length) {
            const result = node.reduce(data, { key, path, pointer });
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
        if (options.createSchema === true) {
            return node.compileSchema(createSchema(getValue(data, key)), `${node.spointer}/additional`, `${node.schemaId}/additional`);
        }
        if (options.withSchemaWarning === true) {
            return node.createError("SchemaWarning", { pointer, value: data, schema: node.schema, key });
        }
    },
    /** Creates data that is valid to the schema of this node */
    getTemplate(data, options) {
        const node = this;
        const opts = {
            recursionLimit: 1,
            ...node.context.templateDefaultOptions,
            cache: {},
            ...(options !== null && options !== void 0 ? options : {})
        };
        return node.context.methods.getTemplate(node, data, opts);
    },
    getDraftVersion() {
        return this.context.version;
    },
    reduce(data, options = {}) {
        const { key, pointer, path } = options;
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
    /** Creates a new node with all dynamic schema properties merged according to the passed in data */
    validate(data, pointer = "#", path = []) {
        var _a;
        const errors = (_a = validateNode(this, data, pointer, path)) !== null && _a !== void 0 ? _a : [];
        const flatErrorList = sanitizeErrors(Array.isArray(errors) ? errors : [errors]).filter(isJsonError);
        return {
            valid: flatErrorList.length === 0,
            errors: flatErrorList
        };
    },
    async validateAsync(data, pointer = "#", path = []) {
        var _a;
        const errors = (_a = validateNode(this, data, pointer, path)) !== null && _a !== void 0 ? _a : [];
        let resolvedErrors = await Promise.all(sanitizeErrors(Array.isArray(errors) ? errors : [errors]));
        resolvedErrors = sanitizeErrors(resolvedErrors);
        return {
            valid: resolvedErrors.length === 0,
            errors: resolvedErrors
        };
    },
    /**
     * Register a json-schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemote(url, schema) {
        var _a;
        // @draft >= 6
        schema.$id = joinId(schema.$id || url);
        const { context } = this;
        const draft = getDraft(context.drafts, (_a = schema === null || schema === void 0 ? void 0 : schema.$schema) !== null && _a !== void 0 ? _a : this.context.rootNode.$schema);
        const node = {
            spointer: "#",
            lastIdPointer: "#",
            schemaId: "#",
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            context: {
                ...context,
                refs: {},
                anchors: {},
                ...copy(pick(draft, "methods", "keywords", "version", "formats", "errors"))
            },
            ...SchemaNodeMethods
        };
        node.context.rootNode = node;
        node.context.remotes[joinId(url)] = node;
        addKeywords(node);
        return this;
    },
    toJSON() {
        var _a;
        return { ...this, context: undefined, errors: undefined, parent: (_a = this.parent) === null || _a === void 0 ? void 0 : _a.spointer };
    }
};
const whitelist = ["$ref", "if", "$defs"];
const noRefMergeDrafts = ["draft-04", "draft-06", "draft-07"];
export function addKeywords(node) {
    if (node.schema.$ref && noRefMergeDrafts.includes(node.context.version)) {
        // for these draft versions only ref is validated
        node.context.keywords
            .filter(({ keyword }) => whitelist.includes(keyword))
            .forEach((keyword) => execKeyword(keyword, node));
        return;
    }
    const keys = Object.keys(node.schema);
    node.context.keywords
        .filter(({ keyword }) => keys.includes(keyword) || whitelist.includes(keyword))
        .forEach((keyword) => execKeyword(keyword, node));
}
export function execKeyword(keyword, node) {
    var _a, _b, _c, _d;
    // @todo consider first parsing all nodes
    (_a = keyword.parse) === null || _a === void 0 ? void 0 : _a.call(keyword, node);
    if ((_b = keyword.addReduce) === null || _b === void 0 ? void 0 : _b.call(keyword, node)) {
        node.reducers.push(keyword.reduce);
    }
    if ((_c = keyword.addResolve) === null || _c === void 0 ? void 0 : _c.call(keyword, node)) {
        node.resolvers.push(keyword.resolve);
    }
    if ((_d = keyword.addValidate) === null || _d === void 0 ? void 0 : _d.call(keyword, node)) {
        node.validators.push(keyword.validate);
    }
}
