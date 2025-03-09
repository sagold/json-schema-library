import { propertiesValidator } from "../features/properties";
import { SchemaNode } from "./types";
import { minLengthValidator, maxLengthValidator } from "../features/string";
import { additionalPropertiesValidator } from "../features/additionalProperties";
import { typeValidator } from "../features/type";
import { itemsValidator } from "../features/items";
import { additionalItemsValidator } from "../features/additionalItems";
import { containsValidator } from "../features/contains";
import { requiredValidator } from "../features/required";
import { validateOneOf } from "../features/oneOf";
import { constValidator } from "../features/const";
import { exclusiveMinimumValidator } from "../features/exclusiveMinimum";
import { patternPropertiesValidator } from "../features/patternProperties";
import { uniqueItemsValidator } from "../features/uniqueItems";
import { enumValidator } from "../features/enum";
import { notValidator } from "../features/not";
import { allOfValidator } from "../features/allOf";
import { ifThenElseValidator } from "../features/ifthenelse";
import { anyOfValidator } from "../features/anyOf";
import { formatValidator } from "../features/format";
import { patternValidator } from "../features/pattern";
import { propertyNamesValidator } from "../features/propertyNames";
import { dependentRequiredValidator } from "../features/dependentRequired";
import { dependentSchemasValidator } from "../features/dependentSchemas";
import { maximumValidator } from "../features/maximum";
import { minimumValidator } from "../features/minimum";
import { multipleOfValidator } from "../features/multipleOf";
import { exclusiveMaximumValidator } from "../features/exclusiveMaximum";
import { maxItemsValidator } from "../features/maxItems";
import { minItemsValidator } from "../features/minItems";
import { unevaluatedPropertiesValidator } from "../features/unevaluatedProperties";
import { unevaluatedItemsValidator } from "../features/unevaluatedItems";
import { maxPropertiesValidator } from "../features/maxProperties";
import { minPropertiesValidator } from "../features/minProperties";
import { JsonError } from "../../lib/types";

export const VALIDATORS: ((node: SchemaNode) => void)[] = [
    additionalItemsValidator,
    additionalPropertiesValidator,
    allOfValidator,
    anyOfValidator,
    containsValidator,
    constValidator,
    dependentRequiredValidator,
    dependentSchemasValidator,
    enumValidator,
    exclusiveMinimumValidator,
    formatValidator,
    exclusiveMaximumValidator,
    exclusiveMinimumValidator,
    ifThenElseValidator,
    itemsValidator,
    maxItemsValidator,
    maxLengthValidator,
    maxPropertiesValidator,
    minItemsValidator,
    minLengthValidator,
    minPropertiesValidator,
    multipleOfValidator,
    patternValidator,
    propertyNamesValidator,
    propertiesValidator,
    patternPropertiesValidator,
    notValidator,
    minimumValidator,
    maximumValidator,
    requiredValidator,
    validateOneOf,
    typeValidator,
    unevaluatedItemsValidator,
    unevaluatedPropertiesValidator,
    uniqueItemsValidator,
    ({ schema, validators }: SchemaNode) => {
        if (schema.$ref == null && schema.$recursiveRef == null) {
            return;
        }
        validators.push(({ node, data, pointer = "#", path }) => {
            let currentNode = node;
            let nextNode = node.resolveRef({ pointer, path });
            if (nextNode == null) {
                // @todo evaluate this state - should return node or ref is invalid (or bugged)
                return;
            }
            // console.log(
            //     "REF VALIDATOR: first resolved",
            //     node.spointer,
            //     `ref: ${node.ref}`,
            //     "to",
            //     nextNode.spointer,
            //     nextNode.schema
            // );
            const errors: JsonError[] = [];

            while (currentNode !== nextNode && currentNode.spointer !== nextNode?.spointer) {
                // console.log(
                //     "REF VALIDATOR: resolved to",
                //     nextNode.spointer,
                //     "ref: ",
                //     nextNode.ref,
                //     "=>",
                //     nextNode.schema
                // );
                errors.push(...nextNode.validate(data, pointer, path));
                currentNode = nextNode;
                nextNode = nextNode.resolveRef({ pointer, path });
            }
            // console.log("REF VALIDATOR: currentNode", currentNode?.spointer, nextNode?.spointer);
            return errors;
        });
    }
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
