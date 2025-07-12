import { strings } from "@angular-devkit/core";

export function processTemplate(
  template: string,
  options: { name: string }
): string {
  return template.replace(/<%= (\w+)\((\w+)\) %>/g, (match, fn, arg) => {
    if (fn === "classify" && arg === "name") {
      return strings.classify(options.name);
    }
    if (fn === "dasherize" && arg === "name") {
      return strings.dasherize(options.name);
    }
    if (fn === "camelize" && arg === "name") {
      return strings.camelize(options.name);
    }
    return match;
  });
}
