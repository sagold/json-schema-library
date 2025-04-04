import { JsonError } from "../types";
import { Feature, JsonSchemaValidatorParams } from "../Feature";
import deepEqual from "fast-deep-equal";

export const uniqueItemsFeature: Feature = {
    id: "uniqueItems",
    keyword: "uniqueItems",
    addValidate: ({ schema }) => schema.uniqueItems === true,
    validate: validateUniqueItems
};

function validateUniqueItems({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!Array.isArray(data)) {
        return undefined;
    }
    const { schema } = node;
    const duplicates: number[] = [];
    const errors: JsonError[] = [];
    data.forEach((item, index) => {
        for (let i = index + 1; i < data.length; i += 1) {
            if (deepEqual(item, data[i]) && !duplicates.includes(i)) {
                errors.push(
                    node.errors.uniqueItemsError({
                        pointer: `${pointer}/${i}`,
                        duplicatePointer: `${pointer}/${index}`,
                        arrayPointer: pointer,
                        value: JSON.stringify(item),
                        schema
                    })
                );
                duplicates.push(i);
            }
        }
    });

    return errors;
}
