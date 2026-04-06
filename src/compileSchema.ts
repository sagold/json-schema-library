import { copy } from "fast-copy";
import { getRef } from "./keywords/$ref";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { draft2020 } from "./draft2020";
import { pick } from "./utils/pick";
import {
    JsonSchema,
    BooleanSchema,
    Draft,
    isJsonSchema,
    JsonAnnotation,
    JsonError,
    isJsonError,
    isJsonAnnotation,
    isBooleanSchema
} from "./types";
import { TemplateOptions } from "./methods/getData";
import { SchemaNode, SchemaNodeMethods, addKeywords, isSchemaNode } from "./SchemaNode";
import settings from "./settings";
import sanitizeErrors from "./utils/sanitizeErrors";

const { REGEX_FLAGS } = settings;

export type CompileOptions = {
    drafts?: Draft[];
    remote?: SchemaNode;
    formatAssertion?: boolean | "meta-schema" | undefined;
    getDataDefaultOptions?: TemplateOptions;
    /** set to true to throw an Error on errors in input schema. Defaults to false */
    throwOnInvalidSchema?: boolean;
    /** set to true to collect unknown keywords of input schema in `node.schemaAnnotations`. Defaults to false */
    withSchemaAnnotations?: boolean;
    /** set to true to throw an Error when encountering an unresolvable ref  */
    throwOnInvalidRef?: boolean;
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
    const node: SchemaNode & { schemaErrors?: JsonError[]; schemaAnnotations: JsonAnnotation[] } = {
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
            withSchemaAnnotations: options.withSchemaAnnotations ?? false,
            throwOnInvalidRef: options.throwOnInvalidRef ?? false,
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

    if (!isJsonSchema(schema) && !isBooleanSchema(schema)) {
        node.schemaErrors = [
            node.createError("schema-error", {
                pointer: "#",
                schema,
                value: undefined,
                message: `JSON schema must be object or boolean - reveived: '${schema}'`
            })
        ];
        return node;
    }

    // parse and validate schema
    let schemaValidation = addKeywords(node).filter((err) => err != null);
    schemaValidation = sanitizeErrors(schemaValidation);
    const schemaErrors: JsonError[] = [];
    const schemaAnnotations: JsonAnnotation[] = [];
    schemaValidation.forEach((error) => {
        if (isJsonError(error)) {
            schemaErrors.push(error);
        } else if (isJsonAnnotation(error)) {
            schemaAnnotations.push(error);
        }
    });

    if (options.throwOnInvalidSchema && schemaErrors.length > 0) {
        const error = new Error("Invalid schema passed to compileSchema");
        // @ts-expect-error unknown error-property
        error.data = schemaErrors;
        throw error;
    }

    node.schemaErrors = schemaErrors;
    node.schemaAnnotations = schemaAnnotations;

    return node;
}
