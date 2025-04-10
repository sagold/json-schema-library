import { globSync } from "glob";
import { JsonSchema } from "../../types";
import { SchemaNode } from "../../types";
import path from "path";

export function addRemotes(
    node: SchemaNode,
    schemaList: JsonSchema[],
    $schema: string,
    baseURI = "http://localhost:1234"
) {
    // add meta schema
    schemaList.forEach((schema) => {
        node.addRemoteSchema(schema.$id ?? schema.id, schema);
    });
    // add remote files
    const remotesPattern = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "node_modules",
        "json-schema-test-suite",
        "remotes",
        "**",
        "*.json"
    );
    const remotes = globSync(remotesPattern);
    remotes.forEach((filepath: string) => {
        const file = require(filepath); // eslint-disable-line
        const remoteId = `${baseURI}/${filepath.split("/remotes/").pop()}`;
        node.addRemoteSchema(remoteId, { $schema, ...file });
    });
}
