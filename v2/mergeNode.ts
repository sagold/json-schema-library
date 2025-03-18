import { isSchemaNode, SchemaNode } from "./types";
import { mergeSchema } from "../lib/mergeSchema";

interface SchemaNodeCB {
    toJSON?: () => string;
    (...args: unknown[]): void;
}

export function removeDuplicates(fun: SchemaNodeCB, funIndex: number, list: ((...args: unknown[]) => void)[]) {
    if (list.indexOf(fun) !== funIndex) {
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

export function mergeNode(a: SchemaNode, b?: SchemaNode): SchemaNode | undefined {
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
    const mergedNode: SchemaNode = {
        ...a,
        ...b,
        ...arraySelection,
        schema: mergeSchema(a.schema, b.schema),
        parent: a.parent,
        resolvers: a.resolvers.concat(b.resolvers).filter(removeDuplicates),
        reducers: a.reducers.concat(b.reducers).filter(removeDuplicates),
        validators: a.validators.concat(b.validators).filter(removeDuplicates),
        getDefaultData: a.getDefaultData.concat(b.getDefaultData).filter(removeDuplicates),

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
        // $defs?: Record<string, SchemaNode>;
        $defs: mergeObjects(a.$defs, b.$defs),
        // allOf?: SchemaNode[];
        allOf: mergeArray(a.allOf, b.allOf),
        // anyOf?: SchemaNode[];
        anyOf: mergeArray(a.anyOf, b.anyOf),
        // dependentSchemas?: Record<string, SchemaNode | boolean>;
        // dependentSchemas: mergeObjects(a.dependentSchemas, b.dependentSchemas),
        // oneOf?: SchemaNode[];
        oneOf: mergeArray(a.oneOf, b.oneOf),
        // patternProperties?: { pattern: RegExp; node: SchemaNode }[];
        // patternProperties: mergeArray(a.patternProperties, b.patternProperties),
        // properties?: Record<string, SchemaNode>;
        properties: mergeObjects(a.properties, b.properties)
    };

    // mergedNode.context.VALIDATORS.forEach((registerValidator) => registerValidator(mergedNode));
    return mergedNode;
}
