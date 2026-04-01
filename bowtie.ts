/**
 * json-schema-library bowtie integration (test harness)
 */
import readline from "readline/promises";
import process from "node:process";
import os from "os";
import packageJson from "./package.json";
import { compileSchema, JsonSchema } from "./dist/index.mjs";

const stdio = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

type Dialect =
    | "https://json-schema.org/draft/2020-12/schema"
    | "https://json-schema.org/draft/2019-09/schema"
    | "http://json-schema.org/draft-07/schema#"
    | "http://json-schema.org/draft-06/schema#"
    | "http://json-schema.org/draft-04/schema#"
    | "http://json-schema.org/draft-03/schema#";

type StartCmd = {
    cmd: "start";
    version: number;
};
type StartCmdResponse = {
    version: number;
    implementation: {
        /** library language */
        language: "typescript" | "typescript";
        /** library name */
        name: string;
        /** library version */
        version: string;
        homepage: string;
        issues: string;
        source: string;
        dialects: Dialect[];
        /** operating system platform */
        os: string;
        /** operating system version */
        os_version: string;
        /** Node.js version */
        language_version: string;
    };
};
type DialectCommand = {
    cmd: "dialect";
    dialect: Dialect;
};
type RunCmd = {
    cmd: "run";
    seq: number;
    dialect: Dialect;
    case: {
        schema: JsonSchema;
        tests: {
            instance: unknown;
        }[];
        registry: Record<string, JsonSchema>;
    };
};
type RunCmdResponse = {
    seq: number;
    results: ({ valid: boolean } | { errored: true; context: any })[];
};
type StopCommand = {
    cmd: "stop";
};

type Command = StartCmd | RunCmd | DialectCommand | StopCommand;

function isCommand(value: unknown): value is Command {
    return value != null && typeof value === "object" && "cmd" in value && cmds[value.cmd as keyof typeof cmds] != null;
}

/** track command sequence and abort if something is off */
let state: "started" | "dialect" | "testing" | "stopped" = "stopped";
/** current JSON Schema draft version to test */
let dialect: Dialect;

const cmds: {
    /** Start nxet test run, informing bowtie of suppored draft versions and general metadata */
    start: (args: StartCmd) => Promise<StartCmdResponse>;
    /** Set JSON Schema draft-version of following tests */
    dialect: (args: DialectCommand) => Promise<{ ok: true }>;
    /** Run test cases for a specfic schema */
    run: (args: RunCmd) => Promise<RunCmdResponse>;
    /** Finalize test run and exit container */
    stop: (args: StopCommand) => Promise<void>;
} = {
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
        return { ok: true };
    },

    run: async (args: RunCmd): Promise<RunCmdResponse> => {
        console.assert(state === "dialect" || state === "testing");
        state = "testing";
        const { schema, tests, registry } = args.case;

        // catch boolean schema
        if (schema.$schema && typeof schema.$schema === "object") {
            // set draft version to schema
            schema.$schema = dialect;
        }

        // compile schema
        const node = compileSchema(schema);
        // add remote schemata
        for (const id in registry) {
            node.addRemoteSchema(id, registry[id]);
        }
        // run test cases and collect results to be sent back to bowtie
        const results: RunCmdResponse["results"] = tests.map((test) => {
            try {
                return { valid: node.validate(test.instance).valid };
            } catch (error) {
                return {
                    errored: true,
                    context: {
                        traceback: error.stack,
                        message: error.message
                    }
                };
            }
        });
        // response to bowtie for run command
        return { seq: args.seq, results: results };
    },

    stop: async (_) => {
        console.assert(state === "testing");
        state = "stopped";
        process.exit(0);
    }
} as const;

async function waitForCommands() {
    // listen for commands to be sent to container
    for await (const line of stdio) {
        let request: Command;
        try {
            request = JSON.parse(line);
            if (isCommand(request)) {
                let response;
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
                        } catch (error) {
                            response = {
                                seq: request.seq,
                                errored: true,
                                context: {
                                    traceback: error.stack,
                                    message: error.message
                                }
                            };
                        }
                        break;
                    case "stop":
                        response = await cmds.stop(request);
                        break;
                }
                send(response);
            } else {
                send({
                    errored: true,
                    context: {
                        message: `Unsupported command received: '${line}'`
                    }
                });
            }
        } catch (e) {
            send({
                errored: true,
                context: {
                    message: `Invalid json received: '${line}'`
                }
            });
        }
    }
}

function send(data: any) {
    console.log(JSON.stringify(data));
}

waitForCommands();
