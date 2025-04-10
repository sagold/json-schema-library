import { globSync } from "glob";
import path from "path";
export function addRemotes(node, schemaList, $schema, baseURI = "http://localhost:1234") {
    // add meta schema
    schemaList.forEach((schema) => {
        var _a;
        node.addRemoteSchema((_a = schema.$id) !== null && _a !== void 0 ? _a : schema.id, schema);
    });
    // add remote files
    const remotesPattern = path.join(__dirname, "..", "..", "..", "node_modules", "json-schema-test-suite", "remotes", "**", "*.json");
    const remotes = globSync(remotesPattern);
    remotes.forEach((filepath) => {
        const file = require(filepath); // eslint-disable-line
        const remoteId = `${baseURI}/${filepath.split("/remotes/").pop()}`;
        node.addRemoteSchema(remoteId, { $schema, ...file });
    });
}
