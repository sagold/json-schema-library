import { JsonSchema } from "../../types";
export type DraftVersion = "4" | "6" | "7" | "2019-09" | "2020-12";
export type FeatureTest = {
    /** name of feature being tests, e.g. additionalItems */
    name: string;
    /** if the test is retrieved from optional tests */
    optional?: boolean;
    /** list of test cases of feature */
    testCases: TestCase[];
};
export type TestCase = {
    description: string;
    schema: Record<string, any>;
    tests: Test[];
};
export type Test = {
    description: string;
    data: any;
    valid: boolean;
};
export type Setup = {
    logSchema?: boolean;
    only?: {
        name: string;
        description?: string;
    };
    skipTestCase: (t: FeatureTest) => boolean;
    /** $schema string identifying draft, like https://json-schema.org/draft/2019-09/schema */
    metaSchema: JsonSchema;
    metaSchemaList?: JsonSchema[];
    skipTests?: string[];
};
export declare function getDraftTests(draft: DraftVersion): FeatureTest[];
