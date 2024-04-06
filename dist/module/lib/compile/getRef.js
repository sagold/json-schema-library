import { get } from "@sagold/json-pointer";
import splitRef from "./splitRef";
import getTypeOf from "../getTypeOf";
const suffixes = /(#)+$/g;
const isObject = (val) => getTypeOf(val) === "object";
// 1. combined is known
// 2. base or pointer is known
// 3. base + pointer is known
export default function getRef(context, rootSchema, $search) {
    var _a, _b, _c, _d, _e;
    let $ref;
    if (isObject($search)) {
        $ref = $search.__ref || $search.$ref;
    }
    else {
        $ref = $search;
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
            return getRef(context, schema, schema);
        }
        // console.log("»» return", schema);
        return schema;
    }
    // @ts-expect-error @draft 2019-09
    const $anchor = (_a = context.anchors) === null || _a === void 0 ? void 0 : _a[$ref];
    if ($anchor) {
        // console.log("» anchor", $anchor);
        return get(rootSchema, $anchor);
    }
    if (context.ids[$ref] != null) {
        // console.log("» id", context.ids[$ref]);
        schema = get(rootSchema, context.ids[$ref]);
        if (schema && schema.$ref) {
            // @todo add missing test for the following line
            return getRef(context, rootSchema, schema);
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
        // console.log("ids", rootSchema.getContext().ids);
        $ref = fragments[0];
        if (context.remotes[$ref]) {
            // console.log("» remote");
            schema = context.remotes[$ref];
            if (schema && schema.$ref) {
                return getRef(context, rootSchema, schema);
            }
        }
        if (context.ids[$ref]) {
            // console.log("» id");
            schema = get(rootSchema, context.ids[$ref]);
            if (schema && schema.$ref) {
                return getRef(context, rootSchema, schema);
            }
            return schema;
        }
        // @todo why this special case
        const rootContextRef = (_b = rootSchema.getContext) === null || _b === void 0 ? void 0 : _b.call(rootSchema).ids[$ref];
        if (rootContextRef) {
            return getRef(context, rootSchema, rootContextRef);
        }
    }
    if (fragments.length === 2) {
        // console.log("» frag2", fragments);
        const base = fragments[0];
        $ref = fragments[1];
        // @todo this is unnecessary due to inconsistencies
        const fromRemote = (_c = context.remotes[base]) !== null && _c !== void 0 ? _c : context.remotes[`${base}/`];
        if (fromRemote) {
            // console.log("» remote");
            // We have retrieved a different compiled json-schema. This compiled schema contains a
            // separate scope (context) where we might need to work with
            // ANCHOR
            if (fromRemote.getContext && fromRemote.getContext().anchors[$inputRef] != null) {
                // console.log("» remote » anchor");
                // an anchor is stored with its scope (id) it is defined in. Thus collisions are
                // avoided, but the current condition is required to resolve the anchor for now
                return fromRemote.getRef($inputRef);
            }
            // PATH (get_ref)
            if (fromRemote.getRef) {
                // console.log("» remote » ref");
                // resolve the local part of the reference in the new schema
                return fromRemote.getRef($ref);
            }
            //log("warning: uncompiled remote - context may be wrong", base);
            return getRef(context, fromRemote, $ref);
        }
        // @todo this is unnecessary due to inconsistencies
        const fromId = (_d = context.ids[base]) !== null && _d !== void 0 ? _d : context.ids[`${base}/`];
        if (fromId) {
            // console.log("» id", fromId);
            return getRef(context, get(rootSchema, fromId), $ref);
        }
    }
    // console.log("» other");
    schema = get(rootSchema, (_e = context.ids[$ref]) !== null && _e !== void 0 ? _e : $ref);
    if (schema && schema.$ref) {
        return getRef(context, rootSchema, schema);
    }
    return schema;
}
