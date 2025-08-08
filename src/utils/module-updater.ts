// Angular Devkit
import { SchematicsException, strings, Tree } from "@angular-devkit/schematics";

// Utility functions
import { addImportStatement, addProviderEntry } from "./content-manipulator";
import { calculateRelativeImportPath, getParentPath } from "./path-utilities";

/**
 * Finds the first .module.ts file in the ../../ directory relative to the current path
 *
 * @param tree - The virtual file system tree
 * @param currentPath - Current normalized path
 * @returns Path to the module file or null if not found
 */
export function findModuleFile(tree: Tree, currentPath: string): string | null {
  // Navigate to ../../ from current path
  const parentPath = getParentPath(currentPath, 1);

  try {
    // Get directory entries
    const dir = tree.getDir(parentPath);

    // Find all .module.ts files
    const moduleFiles = dir.subfiles
      .filter((file) => file.endsWith(".module.ts"))
      .map((file) => `${parentPath}${file}`);

    if (moduleFiles.length === 0) {
      console.warn(`No .module.ts files found in ${parentPath}`);
      return null;
    }

    if (moduleFiles.length > 1) {
      console.warn(
        `Multiple .module.ts files found in ${parentPath}:`,
        moduleFiles
      );
      console.warn(`Using the first one: ${moduleFiles[0]}`);
    }

    console.log(`Found module file: ${moduleFiles[0]}`);
    return moduleFiles[0];
  } catch (error) {
    console.warn(`Could not access directory ${parentPath}:`, error);
    return null;
  }
}

/**
 * Updates the module file to include the new query handler
 *
 * @param tree - The virtual file system tree
 * @param params - Parameters for module update
 */
export function updateModuleFile(
  tree: Tree,
  params: {
    name: string;
    normalizedPath: string;
    flat: boolean;
  }
) {
  const { name, normalizedPath, flat } = params;

  // Find the module file in ../../
  const modulePath = findModuleFile(tree, normalizedPath);

  if (!modulePath) {
    console.warn("No module file found to update");
    return;
  }

  try {
    const moduleContent = tree.read(modulePath)?.toString("utf-8");

    if (!moduleContent) {
      throw new SchematicsException(
        `Could not read module file: ${modulePath}`
      );
    }

    // Calculate relative import path from module to handler
    const relativeImportPath = calculateRelativeImportPath(
      modulePath,
      normalizedPath,
      name,
      flat
    );

    // Generate import and provider statements
    const importStatement = `import { ${strings.classify(
      name
    )}Handler } from '${relativeImportPath}';`;
    const providerEntry = `    ${strings.classify(name)}Handler,`;

    // Skip if import already exists

    const handlerClass = `${strings.classify(name)}Handler`;

    if (
      moduleContent.includes(importStatement) ||
      moduleContent.includes(providerEntry)
    ) {
      console.log(`Handler ${handlerClass} already exists in module`);
      return;
    }

    console.log(`Adding import: ${importStatement}`);
    console.log(`Adding provider: ${providerEntry}`);

    // Add import statement after existing imports
    const updatedImports = addImportStatement(moduleContent, importStatement);

    if (!/providers\s*:\s*\[/.test(updatedImports)) {
      throw new SchematicsException(
        `No providers array found in ${modulePath}`
      );
    }

    // Add provider to the providers array
    const updatedProviders = addProviderEntry(
      updatedImports,
      providerEntry,
      name
    );

    // Write updated content back to file
    tree.overwrite(modulePath, updatedProviders);
    console.log(`Successfully updated module file: ${modulePath}`);
  } catch (error) {
    throw new SchematicsException(
      `Failed to update module file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
