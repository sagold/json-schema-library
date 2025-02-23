import { getPrecision } from "../../lib/utils/getPrecision";
import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function maximumValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.maximum)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (isNaN(data as number)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < data) {
            return draft.errors.maximumError({
                maximum: schema.maximum,
                length: data,
                value: data,
                pointer,
                schema
            });
        }
        if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === data) {
            return draft.errors.maximumError({
                maximum: schema.maximum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}

export function minimumValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.minimum)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (isNaN(schema.minimum)) {
            return undefined;
        }
        if (schema.minimum > data) {
            return draft.errors.minimumError({
                minimum: schema.minimum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
        if (schema.exclusiveMinimum === true && schema.minimum === data) {
            return draft.errors.minimumError({
                minimum: schema.minimum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}

export function multipleOfValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.multipleOf)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (typeof data !== "number") {
            return undefined;
        }
        const { draft, schema } = node;
        const valuePrecision = getPrecision(data);
        const multiplePrecision = getPrecision(schema.multipleOf);
        if (valuePrecision > multiplePrecision) {
            // value with higher precision then multipleOf-precision can never be multiple
            return draft.errors.multipleOfError({
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
            return draft.errors.multipleOfError({
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
