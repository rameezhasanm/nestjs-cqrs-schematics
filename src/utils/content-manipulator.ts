// Angular Devkit
import { strings } from "@angular-devkit/core";

/**
 * Adds import statement to the module file
 *
 * @param content - Current module file content
 * @param importStatement - Import statement to add
 * @returns Updated content with new import
 */
export function addImportStatement(
  content: string,
  importStatement: string
): string {
  // Try to find the last import statement
  const importRegex = /import.*from\s+['"][^'"]+['"];/g;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    // Find the last import and add after it
    const lastImport = imports[imports.length - 1];
    return content.replace(lastImport, `${lastImport}\n${importStatement}`);
  } else {
    // If no imports found, add at the beginning
    return `${importStatement}\n${content}`;
  }
}

/**
 * Adds provider entry to the providers array in the module file
 *
 * @param content - Current module file content
 * @param providerEntry - Provider entry to add
 * @param name - Query name for duplicate checking
 * @returns Updated content with new provider
 */
export function addProviderEntry(
  content: string,
  providerEntry: string,
  name: string
): string {
  return content.replace(/providers:\s*\[([\s\S]*?)\]/m, (match, providers) => {
    // Check if provider already exists
    if (providers.includes(`${strings.classify(name)}Handler`)) {
      return match;
    }

    // Add new provider to the array
    const existingProviders = providers.trim();
    const separator =
      existingProviders && !existingProviders.endsWith(",") ? "," : "";

    return `providers: [${existingProviders}${separator}\n${providerEntry}\n  ]`;
  });
}
