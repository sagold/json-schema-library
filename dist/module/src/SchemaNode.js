import copy from "fast-copy";
import sanitizeErrors from "./utils/sanitizeErrors";
import settings from "./settings";
import { createSchema } from "./methods/createSchema";
import { toSchemaNodes } from "./methods/toSchemaNodes";
import { isJsonError } from "./types";
import { isObject } from "./utils/isObject";
import { join } from "@sagold/json-pointer";
import { joinId } from "./utils/joinId";
import { mergeNode } from "./mergeNode";
import { omit } from "./utils/omit";
import { pick } from "./utils/pick";
import { render } from "./errors/render";
import { validateNode } from "./validateNode";
import { hasProperty } from "./utils/hasProperty";
import { getNode } from "./getNode";
import { getNodeChild } from "./getNodeChild";
const { DYNAMIC_PROPERTIES } = settings;
export function isSchemaNode(value) {
    return isObject(value) && Array.isArray(value === null || value === void 0 ? void 0 : value.reducers) && Array.isArray(value === null || value === void 0 ? void 0 : value.resolvers);
}
export function isReduceable(node) {
    for (let i = 0, l = DYNAMIC_PROPERTIES.length; i < l; i += 1) {
        // @ts-expect-error interface to object conversion
        if (hasProperty(node, DYNAMIC_PROPERTIES[i])) {
            return true;
        }
    }
    return false;
}
function getDraft(drafts, $schema) {
    var _a;
    if (!Array.isArray(drafts) || drafts.length === 0) {
        throw new Error(`Missing drafts in 'compileSchema({ $schema: "${$schema}" })'`);
    }
    if (drafts.length === 1) {
        return drafts[0];
    }
    return (_a = drafts.find((d) => new RegExp(d.$schemaRegEx).test($schema))) !== null && _a !== void 0 ? _a : drafts[drafts.length - 1];
}
export function joinDynamicId(a, b) {
    if (a == b) {
        return a !== null && a !== void 0 ? a : "";
    }
    if (a == null || b == null) {
        return a || b;
    }
    if (a.startsWith(b)) {
        return a;
    }
    if (b.startsWith(a)) {
        return b;
    }
    return `${a}+${b}`;
}
export const SchemaNodeMethods = {
    /**
     * Compiles a child-schema of this node to its context
     * @returns SchemaNode representing the passed JSON Schema
     */
    compileSchema(schema, evaluationPath = this.evaluationPath, schemaLocation, dynamicId) {
        const nextFragment = evaluationPath.split("/$ref")[0];
        const parentNode = this;
        const node = {
            lastIdPointer: parentNode.lastIdPointer, // ref helper
            context: parentNode.context,
            parent: parentNode,
            evaluationPath,
            dynamicId: joinDynamicId(parentNode.dynamicId, dynamicId),
            schemaLocation: schemaLocation !== null && schemaLocation !== void 0 ? schemaLocation : join(parentNode.schemaLocation, nextFragment),
            reducers: [],
            resolvers: [],
            validators: [],
            schema,
            ...SchemaNodeMethods
        };
        addKeywords(node);
        return node;
    },
    createError(code, data, message) {
        var _a, _b, _c;
        let errorMessage = message;
        if (errorMessage === undefined) {
            const error = (_c = (_b = (_a = this.schema) === null || _a === void 0 ? void 0 : _a.errorMessages) === null || _b === void 0 ? void 0 : _b[code]) !== null && _c !== void 0 ? _c : this.context.errors[code];
            if (typeof error === "function") {
                return error(data);
            }
            errorMessage = render(error !== null && error !== void 0 ? error : name, data);
        }
        return { type: "error", code, message: errorMessage, data };
    },
    createSchema,
    getChildSelection(property) {
        const node = this;
        return node.context.methods.getChildSelection(node, property);
    },
    getNode,
    getNodeChild,
    /**
     * @returns for $ref, the corresponding SchemaNode or undefined
     */
    getNodeRef($ref) {
        const node = this;
        return node.compileSchema({ $ref }, "$dynamic").resolveRef();
    },
    getNodeRoot() {
        const node = this;
        return node.context.rootNode;
    },
    /**
     * @returns draft version this JSON Schema is evaluated by
     */
    getDraftVersion() {
        return this.context.version;
    },
    /**
     * @returns data that is valid to the schema of this node
     */
    getData(data, options) {
        const node = this;
        const opts = {
            recursionLimit: 1,
            ...node.context.getDataDefaultOptions,
            cache: {},
            ...(options !== null && options !== void 0 ? options : {})
        };
        return node.context.methods.getData(node, data, opts);
    },
    /**
     * @returns SchemaNode with a reduced JSON Schema matching the given data
     */
    reduceNode(data, options = {}) {
        const node = this;
        const { key, pointer, path } = options;
        // @ts-expect-error bool schema
        if (node.schema === false) {
            return { node, error: undefined };
            // @ts-expect-error bool schema
        }
        else if (node.schema === true) {
            const nextNode = node.compileSchema(createSchema(data), node.evaluationPath, node.schemaLocation);
            path === null || path === void 0 ? void 0 : path.push({ pointer, node });
            return { node: nextNode, error: undefined };
        }
        let schema;
        // we need to copy node to prevent modification of source
        // @todo does mergeNode break immutability?
        let workingNode = node.compileSchema(node.schema, node.evaluationPath, node.schemaLocation);
        const reducers = node.reducers;
        for (let i = 0; i < reducers.length; i += 1) {
            const result = reducers[i]({ data, key, node, pointer, path });
            if (isJsonError(result)) {
                return { node: undefined, error: result };
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
            // @ts-expect-error bool schema
            return { node: { ...node, schema: false, reducers: [] }, error: undefined };
        }
        if (workingNode !== node) {
            path === null || path === void 0 ? void 0 : path.push({ pointer, node });
        }
        // remove dynamic properties of node
        workingNode.schema = omit(workingNode.schema, ...DYNAMIC_PROPERTIES);
        // @ts-expect-error string accessing schema props
        DYNAMIC_PROPERTIES.forEach((prop) => (workingNode[prop] = undefined));
        return { node: workingNode, error: undefined };
    },
    /**
     * @returns validation result of data validated by this node's JSON Schema
     */
    validate(data, pointer = "#", path = []) {
        var _a;
        const errors = (_a = validateNode(this, data, pointer, path)) !== null && _a !== void 0 ? _a : [];
        const syncErrors = [];
        const flatErrorList = sanitizeErrors(Array.isArray(errors) ? errors : [errors]).filter(isJsonError);
        const errorsAsync = [];
        sanitizeErrors(Array.isArray(errors) ? errors : [errors]).forEach((error) => {
            if (isJsonError(error)) {
                syncErrors.push(error);
            }
            else if (error instanceof Promise) {
                errorsAsync.push(error);
            }
        });
        const result = {
            valid: flatErrorList.length === 0,
            errors: syncErrors,
            errorsAsync
        };
        return result;
    },
    /**
     * Register a JSON Schema as a remote-schema to be resolved by $ref, $anchor, etc
     * @returns the current node (not the remote schema-node)
     */
    addRemoteSchema(url, schema) {
        var _a;
        // @draft >= 6
        schema.$id = joinId(schema.$id || url);
        const { context } = this;
        const draft = getDraft(context.drafts, (_a = schema === null || schema === void 0 ? void 0 : schema.$schema) !== null && _a !== void 0 ? _a : this.context.rootNode.$schema);
        const node = {
            evaluationPath: "#",
            lastIdPointer: "#",
            schemaLocation: "#",
            dynamicId: "",
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
    /**
     * @returns a list of all sub-schema as SchemaNode
     */
    toSchemaNodes() {
        return toSchemaNodes(this);
    },
    /**
     * @returns a list of values (including objects and arrays) and their corresponding JSON Schema as SchemaNode
     */
    toDataNodes(data, pointer) {
        const node = this;
        return node.context.methods.toDataNodes(node, data, pointer);
    },
    toJSON() {
        var _a;
        return { ...this, context: undefined, errors: undefined, parent: (_a = this.parent) === null || _a === void 0 ? void 0 : _a.evaluationPath };
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
