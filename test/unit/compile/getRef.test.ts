import { expect } from "chai";
import getRef from "../../../lib/compile/getRef";
import gp from "@sagold/json-pointer";


describe("json-pointer", () => {
    it("should resolve empty token in json-pointer", () => {
        const result = gp.get({ bag: { "": { stick: 123 } } }, "/bag//stick");
        expect(result).to.eq(123);
    })
});


describe("compile.getRef", () => {

    it("should return rootSchema", () => {
        const context = { remotes: {}, ids: {} };

        const result = getRef(context, { a: { b: "c" } }, "#");

        expect(result).to.deep.eq({ a: { b: "c" } });
    });

    it("should return value for json-pointer uri", () => {
        const context = { remotes: {}, ids: {} };

        const result = getRef(context, { a: { b: "c" } }, "#/a/b");

        expect(result).to.eq("c");
    });

    it("should resolve ids to pointer", () => {
        const context = { remotes: {}, ids: { "#id": "#/a/b" } };

        const result = getRef(context, { a: { b: "c" } }, "#id");

        expect(result).to.eq("c");
    });

    it("should return remote schema", () => {
        const context = {
            remotes: {
                remote: { a: { b: "c" } }
            }, ids: {}
        };
        const result = getRef(context, null, "remote");

        expect(result).to.eq(context.remotes.remote);
    });

    describe("host/target", () => {

        it("should resolve host/target from ids", () => {
            const context = { remotes: {}, ids: { "http://host.com/#id": "#/a/b" } };

            const result = getRef(context, { a: { b: "c" } }, "http://host.com/#id");

            expect(result).to.eq("c");
        });

        it("should resolve separated host/target from ids", () => {
            const context = {
                remotes: {},
                ids: {
                    "http://host.com": "#/a",
                    "#id": "#/b"
                }
            };

            const result = getRef(context, { a: { b: "c" } }, "http://host.com/#id");

            expect(result).to.eq("c");
        });

        it("should resolve target-pointer from remote host", () => {
            const context = {
                remotes: {
                    "http://host.com": { a: { b: "c" } }
                },
                ids: {}
            };

            const result = getRef(context, null, "http://host.com/#/a/b");

            expect(result).to.eq("c");
        });

        it("should call 'getRef' when resolving remotes", () => {
            let called = false;
            const context = {
                remotes: {
                    "http://host.com": { getRef: () => (called = true) }
                },
                ids: {}
            };

            getRef(context, null, "http://host.com/#/a/b");

            expect(called).to.eq(true);
        });
    });


    describe("recursion", () => {

        it("should resolve pointer recursively", () => {
            const context = { remotes: {}, ids: {} };
            const schema = {
                definitions: {
                    a: { $ref: "#/definitions/b" },
                    b: { type: "integer" }
                }
            };

            const result = getRef(context, schema, "#/definitions/a");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve id recursively", () => {
            const context = { remotes: {}, ids: { "#target": "#/definitions/b" } };
            const schema = {
                definitions: {
                    a: { $ref: "#target" },
                    b: { type: "integer" }
                }
            };

            const result = getRef(context, schema, "#/definitions/a");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve remote recursively", () => {
            const context = {
                remotes: {
                    "http://host.com": {
                        definitions: {
                            a: { $ref: "#/definitions/b" },
                            b: { type: "integer" }
                        }
                    }
                },
                ids: {}
            };
            const result = getRef(context, null, "http://host.com/#/definitions/a");

            expect(result).to.deep.eq({ type: "integer" });
        });
    });
});
