import { isBooleanSchema, isJsonError, isJsonSchema, isSchemaNode, JsonError, SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams, ValidationPath, JsonSchemaReducerParams } from "../Keyword";
import { resolveUri } from "../utils/resolveUri";
import splitRef from "../utils/splitRef";
import { omit } from "../utils/omit";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
import { get, split } from "@sagold/json-pointer";
import { mergeNode } from "../mergeNode";
import { pick } from "../utils/pick";
import settings from "src/settings";

export const $refKeyword: Keyword = {
    id: "$ref",
    keyword: "$ref",
    order: 10,
    parse: parseRef,
    addReduce: (node) => node.$ref != null || node.schema.$dynamicRef != null,
    reduce: reduceRef,
    addValidate: ({ schema }) => schema.$ref != null || schema.$dynamicRef != null,
    validate: validateRef
};

function register(node: SchemaNode, path: string) {
    // Reductions and reference expansions are not authored reference targets.
    if (!node.dynamicId && node.context.refs[path] == null) {
        node.context.refs[path] = node;
    }
}

export function parseRef(node: SchemaNode) {
    // @ts-expect-error add ref resolution method to node
    node.resolveRef = node.schema.$ref != null && node.schema.$dynamicRef != null ? resolveAdjacentRefs : resolveRef;

    // get and store current $id of node - this may be the same as parent $id
    const currentId = resolveUri(node.parent?.$id ?? node.$id, node.schema?.$id);
    node.$id = currentId;
    node.lastIdPointer = node.parent?.lastIdPointer ?? "#";
    if (currentId !== node.parent?.$id && node.evaluationPath !== "#") {
        node.lastIdPointer = node.evaluationPath;
    }

    // store this node for retrieval by $id + json-pointer from $id
    if (node.lastIdPointer !== "#" && node.evaluationPath.startsWith(node.lastIdPointer)) {
        const localPointer = `#${node.evaluationPath.replace(node.lastIdPointer, "")}`;
        register(node, resolveUri(currentId, localPointer));
    }
    // store $rootId + json-pointer to this node
    register(node, resolveUri(node.context.rootNode.$id, node.evaluationPath));

    // @draft-2020:  A $dynamicRef to a $dynamicAnchor in the same schema resource behaves like a normal $ref to an $anchor
    const anchor = node.schema.$anchor;
    if (anchor && !node.dynamicId) {
        // store this node for retrieval by $id + anchor
        const anchorUrl = `${currentId.replace(/#$/, "")}#${anchor}`;
        if (node.context.anchors[anchorUrl] == null) {
            node.context.anchors[anchorUrl] = node;
        }
    }

    const dynamicAnchor = node.schema.$dynamicAnchor;
    if (dynamicAnchor && !node.dynamicId) {
        // store this node for retrieval by $id + anchor
        const dynamicAnchorUrl = `${currentId.replace(/#$/, "")}#${dynamicAnchor}`;
        if (node.context.dynamicAnchors[dynamicAnchorUrl] == null) {
            node.context.dynamicAnchors[dynamicAnchorUrl] = node;
        }
    }

    // precompile reference
    if (node.schema.$ref != null) {
        node.$ref = resolveUri(currentId, node.schema.$ref);
        if (node.$ref.startsWith("/")) {
            node.$ref = `#${node.$ref}`;
        }
    }

    // validate simple ref to definitions
    if (node.$ref?.startsWith("#/$defs/")) {
        if (get(node.getNodeRoot().schema, node.$ref) == null) {
            return node.createError("schema-error", {
                pointer: `${node.schemaLocation}/$ref`,
                schema: node.schema,
                value: node.schema.$ref,
                message: `Invalid $ref to missing target '${node.schema.ref}'`
            });
        }
    }
}

export function reduceRef({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
    if (node == null) {
        return;
    }

    const resolvedNode = node.resolveRef({ pointer, path });
    if (isJsonError(resolvedNode)) {
        return resolvedNode;
    }
    if (resolvedNode == null) {
        return node.createError("ref-error", {
            ref: node.schema.$ref ?? node.schema.$dynamicRef,
            pointer,
            schema: node.schema,
            value: data
        });
    }

    if (node.resolveRef === resolveAdjacentRefs) {
        const result = resolvedNode.reduceNode(data, { key, pointer, path });
        return result.node ?? result.error;
    }

    if (
        resolvedNode.context === node.context &&
        resolvedNode.$id === node.$id &&
        resolvedNode.schemaLocation === node.schemaLocation
    ) {
        return resolvedNode;
    }
    const merged = mergeNode(node, resolvedNode) as SchemaNode;
    const { node: reducedNode, error } = merged.reduceNode(data, { key, pointer, path });
    return reducedNode ?? error;
}

export function resolveRef(this: SchemaNode, options: { pointer?: string; path?: ValidationPath } = {}): SchemaNode | JsonError {
    const { pointer, path = [] } = options;
    if (this.schema.$dynamicRef != null) {
        const nextNode = resolveRecursiveRef(this, path);
        if (isJsonError(nextNode)) {
            return nextNode;
        }
        path.push({ pointer: pointer!, node: nextNode! });
        return nextNode;
    }

    return resolveStaticRef.call(this, options);
}

export function resolveStaticRef(this: SchemaNode, { pointer, path = [] }: { pointer?: string; path?: ValidationPath } = {}) {
    if (this.$ref == null) {
        return this;
    }

    const resolvedNode = getRef(this);
    if (isSchemaNode(resolvedNode)) {
        path.push({ pointer: pointer!, node: resolvedNode });
    }

    return resolvedNode;
}

export function resolveAdjacentRefs(this: SchemaNode) {
    const keyword = this.context.version === "draft-2019-09" ? "$recursiveRef" : "$dynamicRef";
    // A distinct derived location lets schema traversal visit both applicators without replacing authored targets.
    return this.compileSchema(
        {
            ...pick(this.schema, ...settings.PROPERTIES_TO_MERGE),
            allOf: [{ $ref: this.schema.$ref }, { [keyword]: this.schema[keyword] }]
        },
        `${this.evaluationPath}/$ref`,
        `${this.schemaLocation}/$ref`,
        `${this.schemaLocation}($ref+${keyword})`
    );
}

function validateRef({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    const nextNode = node.resolveRef({ pointer, path });
    if (nextNode != null) {
        // recursively resolveRef and validate
        return validateNode(nextNode, data, pointer, path);
    }
    return node.createError("ref-error", {
        ref: node.schema.$ref ?? node.schema.$dynamicRef,
        pointer,
        schema: node.schema,
        value: data
    });
}

// https://json-schema.org/draft/2020-12/json-schema-core#dynamic-ref
function resolveRecursiveRef(node: SchemaNode, path: ValidationPath): SchemaNode | JsonError {
    let refInCurrentScope = resolveUri(node.$id, node.schema.$dynamicRef);
    const [resource, refFragment] = splitRef(refInCurrentScope);
    const remote = resource && node.context.remotes[resource];
    if (remote && refFragment) {
        refInCurrentScope = resolveUri(remote.$id, refFragment);
    }
    // Only an initial URI identifying a dynamic anchor enables dynamic resolution.
    if (node.context.dynamicAnchors[refInCurrentScope] == null) {
        return getRef(node, refInCurrentScope);
    }

    // Select the outermost resource in the current scope with an identically named anchor.
    const fragment = node.schema.$dynamicRef.split("#").pop();
    for (const entry of path) {
        const ref = resolveUri(entry.node.$id, `#${fragment}`);
        const anchorNode = node.context.dynamicAnchors[ref];
        if (anchorNode) {
            return compileNext(anchorNode, node);
        }
    }
    return getRef(node, refInCurrentScope);
}

export function compileNext(referencedNode: SchemaNode, sourceNode: SchemaNode) {
    let referencedSchema = referencedNode.schema;
    if (isObject(referencedNode.schema)) {
        referencedSchema = {
            ...omit(referencedNode.schema, "$id"),
            ...pick(sourceNode.schema, ...settings.PROPERTIES_TO_MERGE)
        };
    }
    return referencedNode.compileSchema(
        referencedSchema,
        `${sourceNode.evaluationPath}/$ref`,
        referencedNode.schemaLocation,
        sourceNode.dynamicId || `${sourceNode.schemaLocation}($ref)`
    );
}

export function getRef(node: SchemaNode, $ref = node?.$ref): SchemaNode | JsonError {
    if ($ref == null) {
        return node;
    }

    // resolve $ref by json-evaluationPath
    if (node.context.refs[$ref]) {
        return compileNext(node.context.refs[$ref], node);
    }
    // resolve $ref from $anchor
    if (node.context.anchors[$ref]) {
        return compileNext(node.context.anchors[$ref], node);
    }
    // resolve $ref from $dynamicAnchor
    if (node.context.dynamicAnchors[$ref]) {
        // A $ref to a $dynamicAnchor in the same schema resource behaves like a normal $ref to an $anchor
        return compileNext(node.context.dynamicAnchors[$ref], node);
    }

    // check for remote-host + pointer pair to switch rootSchema
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        return node.createError("ref-error", {
            ref: $ref,
            pointer: node.evaluationPath,
            schema: node.schema,
            value: undefined
        });
    }

    // resolve $ref as remote-host
    if (fragments.length === 1) {
        const $ref = fragments[0];
        // this is a reference to remote-host root node
        if (node.context.remotes[$ref]) {
            return compileNext(node.context.remotes[$ref], node);
        }

        if ($ref[0] === "#") {
            // support refOfUnknownKeyword
            const rootSchema = node.context.rootNode.schema;
            const targetSchema = get(rootSchema, $ref);
            if (isJsonSchema(targetSchema) || isBooleanSchema(targetSchema)) {
                // A newly reached document location is authored; only its reference expansion is derived.
                const target = node.context.rootNode.compileSchema(targetSchema, $ref, $ref);
                return compileNext(target, node);
            }
        }
        // console.error("REF: UNFOUND 1", $ref);
        return node.createError("ref-error", {
            ref: $ref,
            pointer: node.evaluationPath,
            schema: node.schema,
            value: undefined
        });
    }

    if (fragments.length === 2) {
        const $remoteHostRef = fragments[0];
        // this is a reference to remote-host root node (and not a self reference)
        if (node.context.remotes[$remoteHostRef] && node !== node.context.remotes[$remoteHostRef]) {
            const referencedNode = node.context.remotes[$remoteHostRef];
            // resolve full ref on remote schema - we store currently only store ref with domain
            let nextNode = getRef(referencedNode, resolveUri(referencedNode.$id, fragments[1]));
            if (isSchemaNode(nextNode)) {
                return nextNode;
            }
            // @note required for test spec 04
            nextNode = getRef(referencedNode, fragments[1]);
            if (isSchemaNode(nextNode)) {
                return nextNode;
            }
        }

        // resolve by json-pointer (optional dynamicRef)
        if (node.context.refs[$remoteHostRef]) {
            const parentNode = node.context.refs[$remoteHostRef];
            const path = split(fragments[1]);
            // @todo add utility to resolve schema-pointer to schema
            let currentNode = parentNode;
            for (const item of path) {
                const property = item === "definitions" ? "$defs" : item;
                // @ts-expect-error random path
                currentNode = currentNode[property];
                if (currentNode == null) {
                    // console.error("REF: FAILED RESOLVING ref json-pointer", fragments[1]);
                    return node.createError("ref-error", {
                        ref: $ref,
                        pointer: node.evaluationPath,
                        schema: node.schema,
                        value: undefined,
                        host: fragments[0],
                        local: fragments[1]
                    });
                }
            }
            return currentNode;
        }
    }

    return node.createError("ref-error", {
        ref: $ref,
        pointer: node.evaluationPath,
        schema: node.schema,
        value: undefined
    });
}
