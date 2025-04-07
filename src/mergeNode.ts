import { isSchemaNode, SchemaNode } from "./types";
import { mergeSchema } from "./utils/mergeSchema";

interface SchemaNodeCB {
    toJSON?: () => string;
    order?: number;
    (...args: unknown[]): void;
}

function sortCb(a: SchemaNodeCB, b: SchemaNodeCB) {
    return (b.order ?? 0) - (a.order ?? 0);
}

export function removeDuplicates(fun: SchemaNodeCB, funIndex: number, list: ((...args: unknown[]) => void)[]) {
    if (fun == null || list.indexOf(fun) !== funIndex) {
        return false;
    }
    const funName = fun.toJSON?.() ?? fun.name;
    return list.find((fun: SchemaNodeCB, index) => (fun.toJSON?.() ?? fun.name) === funName && index === funIndex);
}

function mergeObjects(a?: Record<string, SchemaNode>, b?: Record<string, SchemaNode>) {
    if (a == null || b == null) {
        return b || a;
    }
    const object: Record<string, SchemaNode> = {};
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

function mergeArray<T = unknown[]>(a?: T[], b?: T[]) {
    return a || b ? [...(a ?? []), ...(b ?? [])] : undefined;
}

export function mergeNode(a: SchemaNode, b?: SchemaNode, ...omit: string[]): SchemaNode | undefined {
    if (a == null || b == null) {
        return a || b;
    }

    // do not merge itemsObject and itemsList (+ additionalItems)
    const arraySelection: Partial<SchemaNode> = {};
    if ((a.itemsObject && b.itemsList) || (a.itemsList && b.itemsObject)) {
        if (b.itemsList) {
            arraySelection.itemsList = b.itemsList;
        } else {
            arraySelection.itemsObject = b.itemsObject;
        }
    } else {
        // itemsList?: SchemaNode[];
        arraySelection.itemsList = b.itemsList ?? a.itemsList;
        arraySelection.itemsObject = mergeNode(a.itemsObject, b.itemsObject);
    }

    // we have no node-type if (atype !== b.type) {return a; }

    // note: {x: b.x ?? a.x} is already done by {...a, ...b}
    const mergedNode: SchemaNode = {
        ...a,
        ...b,
        ...arraySelection,
        oneOfIndex: a.oneOfIndex ?? b.oneOfIndex,
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
        patternProperties: mergeArray(a.patternProperties, b.patternProperties),
        properties: mergeObjects(a.properties, b.properties)
    };

    // this removes any function that has no keyword associated on schema
    // @todo this might remove default reducers and we need a feature-flag for behaviour
    function filterKeywordsBySchema(fun: SchemaNodeCB) {
        const funName = fun.toJSON?.() ?? fun.name;
        if (mergedNode.schema?.[funName] === undefined) {
            // @ts-expect-error forced key
            mergedNode[funName] = undefined;
            return false;
        }
        return true;
    }

    // @ts-expect-error forced key
    omit?.forEach((key) => (mergedNode[key] = undefined));
    // @todo better run addX features to determine removal as it is more performant and direct?
    mergedNode.resolvers = mergedNode.resolvers.filter(filterKeywordsBySchema);
    mergedNode.reducers = mergedNode.reducers.filter(filterKeywordsBySchema);
    mergedNode.validators = mergedNode.validators.filter(filterKeywordsBySchema);

    return mergedNode;
}
