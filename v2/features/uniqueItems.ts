import { JsonError } from "../../lib/types";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import deepEqual from "fast-deep-equal";

export function uniqueItemsValidator({ schema, validators }: SchemaNode): void {
    if (schema.uniqueItems !== true) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (!Array.isArray(data)) {
            return undefined;
        }
        const { draft, schema } = node;
        const duplicates: number[] = [];
        const errors: JsonError[] = [];
        data.forEach((item, index) => {
            for (let i = index + 1; i < data.length; i += 1) {
                if (deepEqual(item, data[i]) && !duplicates.includes(i)) {
                    errors.push(
                        draft.errors.uniqueItemsError({
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
    });
}
