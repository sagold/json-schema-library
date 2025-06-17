import { JsonError } from "../types.js";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword.js";
import deepEqual from "fast-deep-equal";

export const uniqueItemsKeyword: Keyword = {
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
                    node.createError("unique-items-error", {
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
