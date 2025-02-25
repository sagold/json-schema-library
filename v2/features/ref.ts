import { isSchemaNode, SchemaNode } from "../compiler/types";
import { get } from "@sagold/json-pointer";
import joinScope from "../../lib/compile/joinScope";
import getRef from "./ref/getRef";
import { mergeSchema } from "../../lib/mergeSchema";

const suffixes = /(#|\/)+$/g;

export function parseRef(node: SchemaNode) {
    const { schema, draft, spointer } = node;

    node.resolveRef = resolveRef;

    if (schema.id) {
        // if this is a schema being merged on root object, we cannot override
        // parents locations, but must reuse it
        if (schema.id.startsWith("http") && /(allOf|anyOf|oneOf)\/\d+$/.test(spointer)) {
            const parentPointer = spointer.replace(/\/(allOf|anyOf|oneOf)\/\d+$/, "");
            const parentSchema = get(draft.rootSchema, parentPointer);
            schema.id = parentSchema.id ?? schema.id;
        }
        node.context.ids[schema.id.replace(suffixes, "")] = spointer;
    }

    // build up scopes and add them to $ref-resolution map
    const pointer = `#${spointer}`.replace(/##+/, "#");
    const previousPointer = pointer.replace(/\/[^/]+$/, "");
    const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
    const previousScope = node.context.scopes[previousPointer] || node.context.scopes[parentPointer];
    const scope = joinScope(previousScope, schema.id);
    node.context.scopes[pointer] = scope;
    if (node.context.ids[scope] == null) {
        node.context.ids[scope] = pointer;
    }

    if (schema.$anchor) {
        node.context.anchors[`${scope}#${schema.$anchor}`] = pointer;
    }

    if (schema.$ref) {
        node.ref = joinScope(scope, schema.$ref);
    }
}

export function resolveRef() {
    const node = this as SchemaNode;
    if (node.schema == null) {
        return node;
    }
    // if (node.schema.$recursiveRef) {
    //     return resolveRef(resolveRecursiveRef(node));
    // }
    if (node.ref == null) {
        return node;
    }
    let resolvedSchema = getRef(node.context, node.context.rootSchema, node.ref);
    if (isSchemaNode(resolvedSchema)) {
        resolvedSchema = resolvedSchema.schema;
    }
    // // @ts-expect-error booolean schema
    // if (resolvedSchema === false) {
    //     return resolvedSchema;
    // }
    // @draft >= 2019-09 we now merge schemas: in draft <= 7 $ref is treated as reference, not as schema
    const nextSchema = mergeSchema(resolvedSchema, node.schema, "$ref", "definitions", "$defs");
    return node.compileSchema(node.draft, nextSchema, node.spointer, node);
}

// 1. https://json-schema.org/draft/2019-09/json-schema-core#scopes
// function resolveRecursiveRef(node: SchemaNode): SchemaNode {
//     const history = node.path;
//     // console.log(...history);

//     // RESTRICT BY CHANGE IN BASE-URL
//     let startIndex = 0;
//     for (let i = history.length - 1; i >= 0; i--) {
//         const step = history[i][1];
//         if (step.$id && /^https?:\/\//.test(step.$id) && step.$recursiveAnchor !== true) {
//             startIndex = i;
//             break;
//         }
//     }
//     // FROM THERE FIND FIRST OCCURENCE OF ANCHOR
//     const firstAnchor = history.find((s, index) => index >= startIndex && s[1].$recursiveAnchor === true);
//     if (firstAnchor) {
//         return node.next(firstAnchor[1]);
//     }
//     // THEN RETURN LATEST BASE AS TARGET
//     for (let i = history.length - 1; i >= 0; i--) {
//         const step = history[i][1];
//         if (step.$id) {
//             return node.next(step);
//         }
//     }
//     // OR RETURN ROOT
//     return node.next(node.draft.rootSchema);
// }
