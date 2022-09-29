/* eslint max-len: 0 */
import glob from "glob";
import path from "path";
import { Draft } from "../../../lib/draft";

export interface AddSchema {
    (remoteURI: string, file: Record<string, any>): void;
}

export function addRemotes(draft: Draft, baseURI = "http://localhost:1234") {
    // setup remote files
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
    const remotes = glob.sync(remotesPattern);
    // console.log("remotes:");
    remotes.forEach((filepath: string) => {
        const file = require(filepath); // eslint-disable-line
        const remoteId = `${baseURI}/${filepath.split("/remotes/").pop()}`;
        // console.log(` - ${remoteId} ${filepath.includes("base") ? JSON.stringify(file) : ""}`);
        draft.addRemoteSchema(remoteId, file);
    });
}
