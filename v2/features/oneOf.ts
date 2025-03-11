import { JsonSchemaReducerParams, SchemaNode } from "../types";
// const { DECLARATOR_ONEOF, EXPOSE_ONE_OF_INDEX } = settings;

export function parseOneOf(node: SchemaNode) {
    const { schema, spointer } = node;
    if (Array.isArray(schema.oneOf) && schema.oneOf.length) {
        node.oneOf = schema.oneOf.map((s, index) => node.compileSchema(s, `${spointer}/oneOf/${index}`));
        node.reducers.push(reduceOneOf);
    }
}

reduceOneOf.toJSON = () => "reduceOneOf";
function reduceOneOf({ node, data, pointer }: JsonSchemaReducerParams) {
    // !keyword: oneOfProperty
    // an additional <DECLARATOR_ONEOF> (default `oneOfProperty`) on the schema will exactly determine the
    // oneOf value (if set in data)

    // @fixme
    // abort if no data is given an DECLARATOR_ONEOF is set (used by getChildSchemaSelection)
    // this case (data != null) should not be necessary
    // if (data != null && schema[DECLARATOR_ONEOF]) {
    //     const errors = [];
    //     const oneOfProperty = schema[DECLARATOR_ONEOF];
    //     const oneOfValue = getValue(data, oneOfProperty);

    //     if (oneOfValue === undefined) {
    //         return draft.errors.missingOneOfPropertyError({
    //             property: oneOfProperty,
    //             pointer,
    //             schema,
    //             value: data
    //         });
    //     }

    //     for (let i = 0; i < schema.oneOf.length; i += 1) {
    //         // const oneNode = node.next(schema.oneOf[i] as JsonSchema).resolveRef();
    //         // const resultNode = draft.step(oneNode, oneOfProperty, data);
    //         // if (isJsonError(resultNode)) {
    //         //     return resultNode;
    //         // }
    //         const resultNode = node.oneOf[i].get(oneOfProperty, data);
    //         if (resultNode === undefined) {
    //             return draft.errors.missingOneOfDeclaratorError({
    //                 declarator: DECLARATOR_ONEOF,
    //                 oneOfProperty,
    //                 schemaPointer: `${node.spointer}/oneOf/${i}`,
    //                 pointer,
    //                 schema,
    //                 value: data
    //             });
    //         }

    //         let result = flattenArray(draft.validate(resultNode, oneOfValue));
    //         result = result.filter(errorOrPromise);

    //         if (result.length > 0) {
    //             errors.push(...result);
    //         } else {
    //             // @evaluation-info
    //             setOneOfOrigin(node.oneOf[i].schema, i);
    //             // return resultNode.next(oneNode.schema);
    //             return node.oneOf[i];
    //         }
    //     }

    //     return draft.errors.oneOfPropertyError({
    //         property: oneOfProperty,
    //         value: oneOfValue,
    //         pointer,
    //         schema,
    //         errors
    //     });
    // }

    const matches = [];
    for (let i = 0; i < node.oneOf.length; i += 1) {
        if (node.oneOf[i].validate(data).length === 0) {
            matches.push({ index: i, node: node.oneOf[i] });
        }
    }

    if (matches.length === 1) {
        const { node, index } = matches[0];
        node.oneOfIndex = index; // @evaluation-info
        const reducedNode = node.reduce({ data, pointer });
        // console.log("reduce ONEOF success", data, reducedNode.schema);
        return reducedNode;
    }

    // @ts-expect-error boolean schema;
    return node.compileSchema(false, node.spointer);
}

export function validateOneOf({ schema, validators }: SchemaNode): void {
    if (!Array.isArray(schema.oneOf) || !schema.oneOf.length) {
        return;
    }
    validators.push(({ node, data, pointer = "#", path }) => {
        const { draft, oneOf } = node;
        if (!oneOf) {
            return;
        }
        const matches = [];
        const errors = [];
        for (let i = 0; i < oneOf.length; i += 1) {
            const validationResult = oneOf[i].validate(data, pointer, path);
            if (validationResult.length > 0) {
                errors.push(...validationResult);
            } else {
                matches.push({ index: i, node: oneOf[i] });
            }
        }

        if (matches.length === 1) {
            const { node, index } = matches[0];
            node.oneOfIndex = index; // @evaluation-info
            return undefined;
        }

        if (matches.length > 1) {
            return draft.errors.multipleOneOfError({
                value: data,
                pointer,
                schema,
                matches
            });
        }

        return draft.errors.oneOfError({
            value: JSON.stringify(data),
            pointer,
            schema,
            oneOf: schema.oneOf,
            errors
        });
    });
}
