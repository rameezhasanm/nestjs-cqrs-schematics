"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTemplate = processTemplate;
const core_1 = require("@angular-devkit/core");
function processTemplate(template, options) {
    return template.replace(/<%= (\w+)\((\w+)\) %>/g, (match, fn, arg) => {
        if (fn === "classify" && arg === "name") {
            return core_1.strings.classify(options.name);
        }
        if (fn === "dasherize" && arg === "name") {
            return core_1.strings.dasherize(options.name);
        }
        if (fn === "camelize" && arg === "name") {
            return core_1.strings.camelize(options.name);
        }
        return match;
    });
}
//# sourceMappingURL=template.js.map