import type { Draft } from "./types";
import { errors } from "./errors/errors";
import { additionalItemsFeature } from "./features/additionalItems";
import { additionalPropertiesFeature } from "./features/additionalProperties";
import { allOfFeature } from "./features/allOf";
import { anyOfFeature } from "./features/anyOf";
import { constFeature } from "./features/const";
import { containsFeature } from "./features/contains";
import { defsFeature } from "./features/defs";
import { dependenciesFeature } from "./features/dependencies";
import { enumFeature } from "./features/enum";
import { exclusiveMaximumFeature } from "./features/exclusiveMaximum";
import { exclusiveMinimumFeature } from "./features/exclusiveMinimum";
import { formatFeature } from "./features/format";
import { ifFeature } from "./features/ifthenelse";
import { itemsFeature } from "./features/items";
import { maximumFeature } from "./features/maximum";
import { maxItemsFeature } from "./features/maxItems";
import { maxLengthFeature } from "./features/maxLength";
import { maxPropertiesFeature } from "./features/maxProperties";
import { minimumFeature } from "./features/minimum";
import { minItemsFeature } from "./features/minItems";
import { minLengthFeature } from "./features/minLength";
import { minPropertiesFeature } from "./features/minProperties";
import { multipleOfFeature } from "./features/multipleOf";
import { notFeature } from "./features/not";
import { oneOfFeature } from "./features/oneOf";
import { patternFeature } from "./features/pattern";
import { patternPropertiesFeature } from "./features/patternProperties";
import { propertiesFeature } from "./features/properties";
import { propertyNamesFeature } from "./features/propertyNames";
import { refFeature } from "./features/draft06/ref";
import { requiredFeature } from "./features/required";
import { typeFeature } from "./features/type";
import { unevaluatedItemsFeature } from "./features/unevaluatedItems";
import { unevaluatedPropertiesFeature } from "./features/unevaluatedProperties";
import { uniqueItemsFeature } from "./features/uniqueItems";

/**
 * @draft-07 https://json-schema.org/draft-07/json-schema-release-notes
 *
 * new
 * - "$comment"
 * - "if", "then", "else"
 * - "readOnly"
 * - "writeOnly"
 * - "contentMediaType"
 * - "contentEncoding"
 */
export const draft07: Draft = {
    version: "draft-07",
    $schemaRegEx: "draft-07",
    $schema: "http://json-schema.org/draft-07/schema",
    errors,
    features: [
        refFeature,
        allOfFeature,
        anyOfFeature,
        constFeature,
        containsFeature,
        defsFeature,
        dependenciesFeature, // optional support for old draft-version
        enumFeature,
        exclusiveMaximumFeature,
        exclusiveMinimumFeature,
        formatFeature,
        ifFeature,
        itemsFeature,
        maximumFeature,
        maxItemsFeature,
        maxLengthFeature,
        maxPropertiesFeature,
        minimumFeature,
        minItemsFeature,
        minLengthFeature,
        minPropertiesFeature,
        multipleOfFeature,
        notFeature,
        patternPropertiesFeature,
        patternFeature,
        propertiesFeature,
        propertyNamesFeature,
        requiredFeature,
        typeFeature,
        unevaluatedItemsFeature,
        unevaluatedPropertiesFeature,
        uniqueItemsFeature,
        oneOfFeature,
        additionalItemsFeature,
        additionalPropertiesFeature
    ].map((feature) => {
        const logKeyword = () => feature.keyword;
        if (feature.validate) {
            feature.validate.toJSON = logKeyword;
        }
        if (feature.reduce) {
            feature.reduce.toJSON = logKeyword;
        }
        if (feature.resolve) {
            feature.resolve.toJSON = logKeyword;
        }
        return feature;
    })
};
