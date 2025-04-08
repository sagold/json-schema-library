import { isSchemaNode } from "./types";
import { mergeSchema } from "./utils/mergeSchema";
import { joinDynamicId } from "./SchemaNode";
function sortCb(a, b) {
    var _a, _b;
    return ((_a = b.order) !== null && _a !== void 0 ? _a : 0) - ((_b = a.order) !== null && _b !== void 0 ? _b : 0);
}
export function removeDuplicates(fun, funIndex, list) {
    var _a, _b;
    if (fun == null || list.indexOf(fun) !== funIndex) {
        return false;
    }
    const funName = (_b = (_a = fun.toJSON) === null || _a === void 0 ? void 0 : _a.call(fun)) !== null && _b !== void 0 ? _b : fun.name;
    return list.find((fun, index) => { var _a, _b; return ((_b = (_a = fun.toJSON) === null || _a === void 0 ? void 0 : _a.call(fun)) !== null && _b !== void 0 ? _b : fun.name) === funName && index === funIndex; });
}
function mergeObjects(a, b) {
    if (a == null || b == null) {
        return b || a;
    }
    const object = {};
    [...Object.keys(a), ...Object.keys(b)]
        .filter((p, i, l) => l.indexOf(p) === i)
        .forEach((key) => {
        const result = mergeNode(a[key], b[key]);
        if (isSchemaNode(result)) {
            object[key] = result;
        }
    });
    return object;
}
// function mergeArray<T = unknown[]>(a?: T[], b?: T[]) {
//     return a || b ? [...(a ?? []), ...(b ?? [])] : undefined;
// }
function mergePatternProperties(a, b) {
    if (a == null || b == null) {
        return a || b;
    }
    const result = [...a];
    const pointerList = a.map((p) => p.node.spointer);
    b.forEach((p) => {
        if (!pointerList.includes(p.node.spointer)) {
            result.push(p);
        }
    });
    return result;
}
export function mergeNode(a, b, ...omit) {
    var _a, _b;
    if (a == null || b == null) {
        return a || b;
    }
    // do not merge items and prefixItems (+ additionalItems)
    const arraySelection = {};
    if ((a.items && b.prefixItems) || (a.prefixItems && b.items)) {
        if (b.prefixItems) {
            arraySelection.prefixItems = b.prefixItems;
        }
        else {
            arraySelection.items = b.items;
        }
    }
    else {
        // prefixItems?: SchemaNode[];
        arraySelection.prefixItems = (_a = b.prefixItems) !== null && _a !== void 0 ? _a : a.prefixItems;
        arraySelection.items = mergeNode(a.items, b.items);
    }
    // we have no node-type if (atype !== b.type) {return a; }
    // note: {x: b.x ?? a.x} is already done by {...a, ...b}
    const mergedNode = {
        ...a,
        ...b,
        ...arraySelection,
        dynamicId: joinDynamicId(a.dynamicId, b.dynamicId),
        oneOfIndex: (_b = a.oneOfIndex) !== null && _b !== void 0 ? _b : b.oneOfIndex,
        schema: mergeSchema(a.schema, b.schema, ...omit),
        parent: a.parent,
        resolvers: a.resolvers.concat(b.resolvers).filter(removeDuplicates).sort(sortCb),
        reducers: a.reducers.concat(b.reducers).filter(removeDuplicates).sort(sortCb),
        validators: a.validators.concat(b.validators).filter(removeDuplicates).sort(sortCb),
        additionalItems: mergeNode(a.additionalItems, b.additionalItems),
        additionalProperties: mergeNode(a.additionalProperties, b.additionalProperties),
        contains: mergeNode(a.contains, b.contains),
        if: mergeNode(a.if, b.if),
        then: mergeNode(a.then, b.then),
        else: mergeNode(a.else, b.else),
        not: mergeNode(a.not, b.not),
        propertyNames: mergeNode(a.propertyNames, b.propertyNames),
        unevaluatedProperties: mergeNode(a.unevaluatedProperties, b.unevaluatedProperties),
        unevaluatedItems: mergeNode(a.unevaluatedItems, b.unevaluatedItems),
        $defs: mergeObjects(a.$defs, b.$defs),
        patternProperties: mergePatternProperties(a.patternProperties, b.patternProperties),
        properties: mergeObjects(a.properties, b.properties)
    };
    // this removes any function that has no keyword associated on schema
    function filterKeywordsBySchema(fun) {
        var _a, _b, _c;
        const funName = (_b = (_a = fun.toJSON) === null || _a === void 0 ? void 0 : _a.call(fun)) !== null && _b !== void 0 ? _b : fun.name;
        if (((_c = mergedNode.schema) === null || _c === void 0 ? void 0 : _c[funName]) === undefined) {
            // @ts-expect-error forced key
            mergedNode[funName] = undefined;
            return false;
        }
        return true;
    }
    // @ts-expect-error forced key
    omit === null || omit === void 0 ? void 0 : omit.forEach((key) => (mergedNode[key] = undefined));
    // @todo better run addX features to determine removal as it is more performant and direct?
    mergedNode.resolvers = mergedNode.resolvers.filter(filterKeywordsBySchema);
    mergedNode.reducers = mergedNode.reducers.filter(filterKeywordsBySchema);
    mergedNode.validators = mergedNode.validators.filter(filterKeywordsBySchema);
    return mergedNode;
}
