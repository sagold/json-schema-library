/* json-schema-library bowtie integration (test harness) */
import readline from "readline/promises";
import process from "node:process";
import os from "os";
import packageJson from "json-schema-library/package.json";
import { compileSchema, type SchemaNode } from "json-schema-library";
import { remotes } from "json-schema-library/remotes";
import {
    createBowtieError,
    type Command,
    type CommandMap,
    type CommandResponse,
    type Dialect,
    RunCmdResponse,
    sendToBowtie
} from "./bowtie-api";

/** track command sequence and abort if something is off */
let state: "started" | "dialect" | "testing" | "stopped" = "stopped";
/** current JSON Schema draft version to test */
let dialect: Dialect;
let remote: SchemaNode;

const cmds: CommandMap = {
    start: async (args) => {
        console.assert(args.version === 1, { args });
        console.assert(state === "stopped");
        state = "started";
        return {
            version: 1,
            implementation: {
                language: "typescript",
                name: "json-schema-library",
                version: packageJson.version,
                homepage: "https://github.com/sagold/json-schema-library",
                issues: "https://github.com/sagold/json-schema-library/issues",
                source: "https://github.com/sagold/json-schema-library",

                dialects: [
                    "https://json-schema.org/draft/2020-12/schema",
                    "https://json-schema.org/draft/2019-09/schema",
                    "http://json-schema.org/draft-07/schema#",
                    "http://json-schema.org/draft-06/schema#",
                    "http://json-schema.org/draft-04/schema#"
                ],
                os: os.platform(),
                os_version: os.release(),
                language_version: process.version
            }
        };
    },

    dialect: async (args) => {
        console.assert(state === "started");
        state = "dialect";
        dialect = args.dialect;

        const node = compileSchema({ $schema: dialect });
        remotes.forEach((schema) => {
            node.addRemoteSchema(schema.$id ?? schema.id, schema);
        });
        remote = node;

        return { ok: true };
    },

    run: async (args) => {
        console.assert(state === "dialect" || state === "testing");
        state = "testing";
        const { tests, registry } = args.case;
        let { schema } = args.case;
        if (schema != null && typeof schema === "object") {
            schema = { $schema: dialect, ...schema }; // set default draft version for non-boolean schema
        }
        // compile schema
        const node = compileSchema(schema, { remote, formatAssertion: false });
        // add remote schemata
        for (const id in registry) {
            node.addRemoteSchema(id, registry[id]);
        }
        // run test cases and collect results to be sent back to bowtie
        const results: RunCmdResponse["results"] = tests.map((test) => {
            try {
                return { valid: node.validate(test.instance).valid };
            } catch (e) {
                return createBowtieError(e.message ?? e, e.stack);
            }
        });
        // response to bowtie for run command
        return { seq: args.seq, results: results };
    },

    stop: async (_, stdio) => {
        console.assert(state === "testing");
        state = "stopped";
        if (process.env.JLIB_TEST_RUN !== "true") {
            stdio?.close();
            process.exit(0);
        }
    }
} as const;

export async function runCommand(request: Command, stdio?: readline.Interface) {
    let response: CommandResponse = undefined;
    switch (request.cmd) {
        case "start":
            response = await cmds.start(request);
            break;
        case "dialect":
            response = await cmds.dialect(request);
            break;
        case "run":
            try {
                response = await cmds.run(request);
                return response;
            } catch (error) {
                response = {
                    seq: request.seq,
                    ...createBowtieError((error as Error).message ?? error, (error as Error).stack)
                };
            }
            break;
        case "stop":
            await cmds.stop(request, stdio);
            break;
    }
    return response;
}

function isCommand(value: unknown): value is Command {
    return value != null && typeof value === "object" && "cmd" in value && cmds[value.cmd as keyof typeof cmds] != null;
}

/** listen for commands to be sent to container */
async function waitForBowtieCommands() {
    const stdio = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    for await (const line of stdio) {
        let response;
        try {
            const request = JSON.parse(line);
            response = isCommand(request)
                ? await runCommand(request, stdio)
                : createBowtieError(`Unsupported command received: '${line}'`);
        } catch (e) {
            response = createBowtieError(`Invalid json received: '${line}': ${(e as Error)?.message}`);
        }
        sendToBowtie(response);
    }
}

if (process.env.JLIB_TEST_RUN !== "true") {
    waitForBowtieCommands();
}
