import { get } from "@sagold/json-pointer";
import splitRef from "./splitRef";
import getTypeOf from "../getTypeOf";
import { JsonSchema } from "../types";
import { Context } from "./types";

const suffixes = /(#)+$/g;
const isObject = (val: unknown): val is Record<string, any> => getTypeOf(val) === "object";

// 1. combined is known
// 2. base or pointer is known
// 3. base + pointer is known
export default function getRef(context: Context, rootSchema: JsonSchema, $ref: string): JsonSchema {
    if (isObject($ref)) {
        $ref = $ref.__ref || $ref.$ref;
    }

    if ($ref == null) {
        return rootSchema;
    }

    // console.log("\n$ref", $ref);

    let schema;
    // is it a known $ref?
    const $remote = $ref.replace(suffixes, "");
    if (context.remotes[$remote] != null) {
        schema = context.remotes[$remote];
        // console.log("» remote");
        if (schema && schema.$ref) {
            // console.log("»» reresolve", schema);
            // @todo add missing test for the following line
            return getRef(context, schema, schema.$ref);
        }
        // console.log("»» return", schema);
        return schema;
    }

    // @ts-expect-error @draft 2019-09
    const $anchor = context.anchors?.[$ref];
    // console.log("» anchor?", $anchor);
    if ($anchor) {
        return get(rootSchema, $anchor);
    }

    if (context.ids[$ref] != null) {
        // console.log("» id", context.ids[$ref]);
        schema = get(rootSchema, context.ids[$ref]);
        if (schema && schema.$ref) {
            // @todo add missing test for the following line
            return getRef(context, schema, schema.$ref);
        }
        return schema;
    }

    const $inputRef = $ref;

    // is it a ref with host/pointer?
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        return rootSchema;
    }

    if (fragments.length === 1) {
        // console.log("» frag1", fragments);

        $ref = fragments[0];
        if (context.remotes[$ref]) {
            schema = context.remotes[$ref];

            if (schema && schema.$ref) {
                return getRef(context, rootSchema, schema.$ref);
            }
        }
        if (context.ids[$ref]) {
            schema = get(rootSchema, context.ids[$ref]);

            if (schema && schema.$ref) {
                return getRef(context, rootSchema, schema.$ref);
            }
            return schema;
        }
    }

    if (fragments.length === 2) {
        // console.log("» frag2", fragments);
        const base = fragments[0];
        $ref = fragments[1];


        // @todo this is unnecessary due to inconsistencies
        const fromRemote = context.remotes[base] ?? context.remotes[`${base}/`];
        if (fromRemote) {
            // We have retrieved a different compiled json-schema. This compiled schema contains a
            // separate scope (context) where we might need to work with

            // ANCHOR
            if (fromRemote.getContext && fromRemote.getContext().anchors[$inputRef] != null) {
                // an anchor is stored with its scope (id) it is defined in. Thus collisions are
                // avoided, but the current condition is required to resolve the anchor for now
                return fromRemote.getRef($inputRef);
            }

            // PATH (get_ref)
            if (fromRemote.getRef) {
                // resolve the local part of the reference in the new schema
                return fromRemote.getRef($ref);
            }

            //log("warning: uncompiled remote - context may be wrong", base);
            return getRef(context, fromRemote, $ref);
        }


        // @todo this is unnecessary due to inconsistencies
        const fromId = context.ids[base] ?? context.ids[`${base}/`];
        if (fromId) {
            // console.log("» id", fromId);
            return getRef(context, get(rootSchema, fromId), $ref);
        }
    }

    // console.log("» other");
    schema = get(rootSchema, context.ids[$ref] ?? $ref);
    if (schema && schema.$ref) {
        return getRef(context, rootSchema, schema.$ref);
    }

    return schema;
}
