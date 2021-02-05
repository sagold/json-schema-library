/* eslint quote-props: 0, no-unused-expressions: 0 */
import { expect } from "chai";
import getTypeDefs from "../../../lib/schema/getTypeDefs";


describe("getTypeDefs", () => {

    it("should return all type definitions", () => {
        const defs = getTypeDefs({
            type: "object",
            properties: {
                title: {
                    id: "title",
                    type: "string"
                }
            },
            additionalProperties: {
                id: "additional",
                type: "string"
            },
            patternProperties: {
                "^pattern": {
                    id: "pattern",
                    type: "string"
                }
            },
            dependencies: {
                title: {
                    id: "dependency",
                    type: "string"
                }
            }
        });

        expect(defs).to.deep.eq([
            { pointer: "/properties/title", def: { id: "title", type: "string" } },
            { pointer: "/additionalProperties", def: { id: "additional", type: "string" } },
            { pointer: "/patternProperties/^pattern", def: { id: "pattern", type: "string" } },
            { pointer: "/dependencies/title", def: { id: "dependency", type: "string" } }
        ]);
    });


    it("should return valid type definitions only", () => {
        const defs = getTypeDefs({
            type: "object",
            properties: {
                title: { id: "title", type: "string" }
            },
            additionalProperties: false,
            patternProperties: { "^pattern": { id: "pattern", type: "string" } },
            dependencies: { title: ["caption"] }
        });

        expect(defs).to.deep.eq([
            { pointer: "/properties/title", def: { id: "title", type: "string" } },
            { pointer: "/patternProperties/^pattern", def: { id: "pattern", type: "string" } }
        ]);
    });


    it("should return only valid type definitions from dependencies", () => {
        const defs = getTypeDefs({
            type: "object",
            dependencies: {
                title: ["caption"],
                caption: {
                    type: "string"
                }
            }
        });

        expect(defs).to.deep.eq([
            { pointer: "/dependencies/caption", def: { type: "string" } }
        ]);
    });


    it("should support both item formats", () => {
        const defObject = getTypeDefs({
            type: "array",
            items: {
                id: "object",
                type: "object"
            }
        });

        const defList = getTypeDefs({
            type: "array",
            items: [
                {
                    id: "first-item",
                    type: "object"
                },
                {
                    id: "second-item",
                    type: "object"
                }
            ]
        });

        expect(defObject).to.deep.eq([
            { pointer: "/items", def: { id: "object", type: "object" } }
        ]);

        expect(defList).to.deep.eq([
            { pointer: "/items/0", def: { id: "first-item", type: "object" } },
            { pointer: "/items/1", def: { id: "second-item", type: "object" } }
        ]);
    });
});
