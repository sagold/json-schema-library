export function render(template: string, data: { [p: string]: any } = {}): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const variable = data[key];
        if (variable === null || variable === undefined) return ""; // optional
        if (typeof variable === "object") {
            return JSON.stringify(variable);
        }
        return String(variable);
    });
}
