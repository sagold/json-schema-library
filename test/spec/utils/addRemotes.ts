/* eslint max-len: 0 */
import glob from "glob";
import path from "path";

export interface AddSchema {
    (remoteURI, file: Record<string, any>): void;
}

export function addRemotes(addSchema: AddSchema, baseURI = "http://localhost:1234") {
    // setup remote files
    const remotesPattern = path.join(__dirname, "..", "..", "..", "node_modules", "json-schema-test-suite", "remotes", "**", "*.json");
    const remotes = glob.sync(remotesPattern);
    // console.log("remotes:");
    remotes.forEach(filepath => {
        const file = require(filepath); // eslint-disable-line
        const remoteId = `${baseURI}/${filepath.split("/remotes/").pop()}`;
        // console.log(` - ${remoteId} ${filepath.includes("base") ? JSON.stringify(file) : ""}`);
        addSchema(remoteId, file);
    });
}


