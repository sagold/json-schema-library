import { getPrecision } from "../../lib/utils/getPrecision";
import { SchemaNode } from "../types";

export function multipleOfValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.multipleOf)) {
        return;
    }
    validators.push(({ node, data, pointer }) => {
        if (typeof data !== "number") {
            return undefined;
        }
        const { schema } = node;
        const valuePrecision = getPrecision(data);
        const multiplePrecision = getPrecision(schema.multipleOf);
        if (valuePrecision > multiplePrecision) {
            // value with higher precision then multipleOf-precision can never be multiple
            return node.errors.multipleOfError({
                multipleOf: schema.multipleOf,
                value: data,
                pointer,
                schema
            });
        }

        const precision = Math.pow(10, multiplePrecision);
        const val = Math.round(data * precision);
        const multiple = Math.round(schema.multipleOf * precision);
        if ((val % multiple) / precision !== 0) {
            return node.errors.multipleOfError({
                multipleOf: schema.multipleOf,
                value: data,
                pointer,
                schema
            });
        }

        // maybe also check overflow
        // https://stackoverflow.com/questions/1815367/catch-and-compute-overflow-during-multiplication-of-two-large-integers
        return undefined;
    });
}
