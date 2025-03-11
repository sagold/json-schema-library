import { SchemaNode } from "../types";
import { getValue } from "../utils/getValue";

export function getObjectData(node: SchemaNode) {
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
}
