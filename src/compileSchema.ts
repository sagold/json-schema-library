import { copy } from "fast-copy";
import { getRef } from "./keywords/$ref";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { draft2020 } from "./draft2020";
import { pick } from "./utils/pick";
import { JsonSchema, BooleanSchema, Draft, isJsonSchema } from "./types";
import { TemplateOptions } from "./methods/getData";
import { SchemaNode, SchemaNodeMethods, addKeywords, isSchemaNode } from "./SchemaNode";
import settings from "./settings";

const { REGEX_FLAGS } = settings;

export type CompileOptions = {
    drafts?: Draft[];
    remote?: SchemaNode;
    formatAssertion?: boolean | "meta-schema" | undefined;
    getDataDefaultOptions?: TemplateOptions;
};

const defaultDrafts: Draft[] = [draft04, draft06, draft07, draft2019, draft2020];

function getDraft(drafts: Draft[], $schema: string) {
    return drafts.find((d) => new RegExp(d.$schemaRegEx, REGEX_FLAGS).test($schema)) ?? drafts[drafts.length - 1];
}

/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation as possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(schema: JsonSchema | BooleanSchema, options: CompileOptions = {}) {
    let formatAssertion = options.formatAssertion ?? true;
    const drafts = options.drafts ?? defaultDrafts;
    const draft = getDraft(drafts, isJsonSchema(schema) ? schema.$schema : undefined);

    const node: SchemaNode = {
        evaluationPath: "#",
        lastIdPointer: "#",
        schemaLocation: "#",
        dynamicId: "",
        reducers: [],
        resolvers: [],
        validators: [],
        schema: schema as JsonSchema,
        // @ts-expect-error self-reference added later
        context: {
            remotes: {},
            dynamicAnchors: {},
            ...(options.remote?.context ?? {}),
            anchors: {},
            refs: {},
            ...copy(pick(draft, "methods", "keywords", "version", "formats", "errors")),
            getDataDefaultOptions: options.getDataDefaultOptions,
            drafts
        },
        ...SchemaNodeMethods
    };

    node.context.rootNode = node;
    node.context.remotes[(isJsonSchema(schema) ? schema.$id : undefined) ?? "#"] = node;

    if (options.remote) {
        const metaSchema = getRef(node, node.schema.$schema);
        if (isSchemaNode(metaSchema) && metaSchema.schema.$vocabulary) {
            const vocabs = Object.keys(metaSchema.schema.$vocabulary);
            // const withAnnotations = vocabs.find((vocab) => vocab.includes("vocab/format-annotation"));
            const formatAssertionString = vocabs.find((vocab) => vocab.includes("vocab/format-assertion"));
            if (formatAssertionString && formatAssertion === "meta-schema") {
                formatAssertion = metaSchema.schema.$vocabulary[formatAssertionString] === true;
            }
            const validKeywords = Object.keys(metaSchema.getData({}, { addOptionalProps: true }) as object);
            if (validKeywords.length > 0) {
                node.context.keywords = node.context.keywords.filter((f) => validKeywords.includes(f.keyword));
            }
        }
    }

    if (formatAssertion === false) {
        node.context.keywords = node.context.keywords.filter((f) => f.keyword !== "format");
    }

    addKeywords(node);
    return node;
}
