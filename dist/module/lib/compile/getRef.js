import { get } from "@sagold/json-pointer";
import splitRef from "./splitRef";
import getTypeOf from "../getTypeOf";
const suffixes = /(#|\/)+$/g;
const isObject = (val) => getTypeOf(val) === "object";
// 1. combined is known
// 2. base or pointer is known
// 3. base + pointer is known
export default function getRef(context, rootSchema, $ref) {
    if (isObject($ref)) {
        $ref = $ref.__ref || $ref.$ref;
    }
    if ($ref == null) {
        return rootSchema;
    }
    let schema;
    // is it a known $ref?
    const $remote = $ref.replace(suffixes, "");
    if (context.remotes[$remote]) {
        schema = context.remotes[$remote];
        if (schema && schema.$ref) {
            return getRef(context, rootSchema, schema.$ref);
        }
        return schema;
    }
    if (context.ids[$ref]) {
        schema = get(rootSchema, context.ids[$ref]);
        if (schema && schema.$ref) {
            return getRef(context, rootSchema, schema.$ref);
        }
        return schema;
    }
    // is it a ref with host/pointer?
    const fragments = splitRef($ref);
    if (fragments.length === 0) {
        return rootSchema;
    }
    if (fragments.length === 1) {
        $ref = fragments[0];
        if (context.remotes[$ref]) {
            schema = context.remotes[$ref];
            return getRef(context, rootSchema, schema.$ref);
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
        const base = fragments[0];
        $ref = fragments[1];
        if (context.remotes[base]) {
            if (context.remotes[base].getRef) {
                return context.remotes[base].getRef($ref);
            }
            // console.log("warning: uncompiled remote - context may be wrong", base);
            return getRef(context, context.remotes[base], $ref);
        }
        if (context.ids[base]) {
            return getRef(context, get(rootSchema, context.ids[base]), $ref);
        }
    }
    schema = get(rootSchema, context.ids[$ref] || $ref);
    if (schema && schema.$ref) {
        return getRef(context, rootSchema, schema.$ref);
    }
    return schema;
}
