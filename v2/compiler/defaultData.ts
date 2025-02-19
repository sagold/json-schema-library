import { getValue } from "../getValue";
import { SchemaNode } from "./types";

export const DEFAULT_DATA: ((node: SchemaNode) => void)[] = [
    function getObjectData(node) {
        if (node.schema.type === "object") {
            node.getDefaultData.push(({ data, node }) => {
                const templateData: Record<string, any> = node.schema.default ?? data ?? {};
                if (node.properties) {
                    Object.keys(node.properties).forEach((propertyName) => {
                        templateData[propertyName] = node.properties[propertyName].getTemplate(
                            getValue(templateData, propertyName)
                        );
                    });
                }
                return templateData;
            });
        }
    },
    function getStringData(node) {
        if (node.schema.type === "string") {
            node.getDefaultData.push(({ data, node }) => {
                return node.schema.default ?? data;
            });
        }
    }
];
