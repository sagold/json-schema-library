import { isJsonError } from "../../lib/types";
import { JsonSchemaReducerParams, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
// import { JsonValidator } from "../../lib/validation/type";
// import { SchemaNode } from "../../lib/schemaNode";
// const { DECLARATOR_ONEOF, EXPOSE_ONE_OF_INDEX } = settings;

export function parseOneOf(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (Array.isArray(schema.oneOf) && schema.oneOf.length) {
        // @todo immediately compile if no resolvers are added
        node.oneOf = schema.oneOf.map((s, index) => node.compileSchema(draft, s, `${spointer}/oneOf/${index}`));
        node.reducers.push(reduceOneOf);
    }
}

reduceOneOf.toJSON = () => "reduceOneOf";
function reduceOneOf({ node, data, pointer }: JsonSchemaReducerParams) {
    const { schema, draft } = node;
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
    const errors = [];
    for (let i = 0; i < node.oneOf.length; i += 1) {
        const oneOfNode = node.oneOf[i].reduce({ data, pointer });
        if (isJsonError(oneOfNode)) {
            return oneOfNode;
        }
        const validationResult = oneOfNode.validate(data);
        if (validationResult.length > 0) {
            errors.push(...validationResult);
        } else {
            matches.push({ index: i, node: oneOfNode });
        }
    }

    if (matches.length === 1) {
        const { node, index } = matches[0];
        node.oneOfIndex = index; // @evaluation-info
        return node;
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
}

export function validateOneOf({ schema, validators }: SchemaNode): void {
    if (!Array.isArray(schema.oneOf) || !schema.oneOf.length) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (!node.oneOf) {
            return;
        }
        // we reduce to a single schema, if this fails (none or multiple found) we return error
        const reducedNode = node.reduce({ data, pointer });
        return isJsonError(reducedNode) ? reducedNode : undefined;
    });
}
