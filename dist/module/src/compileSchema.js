import copy from "fast-copy";
import { getRef } from "./keywords/$ref";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { draft2020 } from "./draft2020";
import { pick } from "./utils/pick";
import { SchemaNodeMethods, addKeywords, isSchemaNode } from "./SchemaNode";
const defaultDrafts = [draft04, draft06, draft07, draft2019, draft2020];
function getDraft(drafts, $schema) {
    var _a;
    return (_a = drafts.find((d) => new RegExp(d.$schemaRegEx).test($schema))) !== null && _a !== void 0 ? _a : drafts[drafts.length - 1];
}
/**
 * With compileSchema we replace the schema and all sub-schemas with a schemaNode,
 * wrapping each schema with utilities and as much preevaluation is possible. Each
 * node will be reused for each task, but will create a compiledNode for bound data.
 */
export function compileSchema(schema, options = {}) {
    var _a, _b, _c, _d, _e;
    let formatAssertion = (_a = options.formatAssertion) !== null && _a !== void 0 ? _a : true;
    const drafts = (_b = options.drafts) !== null && _b !== void 0 ? _b : defaultDrafts;
    const draft = getDraft(drafts, schema === null || schema === void 0 ? void 0 : schema.$schema);
    const node = {
        evaluationPath: "#",
        lastIdPointer: "#",
        schemaLocation: "#",
        dynamicId: "",
        reducers: [],
        resolvers: [],
        validators: [],
        schema,
        // @ts-expect-error self-reference added later
        context: {
            remotes: {},
            dynamicAnchors: {},
            ...((_d = (_c = options.remote) === null || _c === void 0 ? void 0 : _c.context) !== null && _d !== void 0 ? _d : {}),
            anchors: {},
            refs: {},
            ...copy(pick(draft, "methods", "keywords", "version", "formats", "errors")),
            getDataDefaultOptions: options.getDataDefaultOptions,
            drafts
        },
        ...SchemaNodeMethods
    };
    node.context.rootNode = node;
    node.context.remotes[(_e = schema === null || schema === void 0 ? void 0 : schema.$id) !== null && _e !== void 0 ? _e : "#"] = node;
    if (options.remote) {
        const metaSchema = getRef(node, node.schema.$schema);
        if (isSchemaNode(metaSchema) && metaSchema.schema.$vocabulary) {
            const vocabs = Object.keys(metaSchema.schema.$vocabulary);
            // const withAnnotations = vocabs.find((vocab) => vocab.includes("vocab/format-annotation"));
            const formatAssertionString = vocabs.find((vocab) => vocab.includes("vocab/format-assertion"));
            if (formatAssertion === "meta-schema") {
                formatAssertion = metaSchema.schema.$vocabulary[formatAssertionString] === true;
            }
            const validKeywords = Object.keys(metaSchema.getData({}, { addOptionalProps: true }));
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
