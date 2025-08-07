// Angular Devkit
import { strings } from "@angular-devkit/core";
import { SchematicsException, Tree } from "@angular-devkit/schematics";

// Interfaces
import { GenerateOptions } from "../interface/index";

// Constants
import { DEFAULT_OPTIONS } from "../consants";

/**
 * Normalizes and validates the input options
 *
 * @param options - Raw input options
 * @returns Normalized options with defaults applied
 */
export function normalizeOptions(options: GenerateOptions) {
  const name = strings.dasherize(options.name);
  const path = options.path ? `src/${options.path}` : DEFAULT_OPTIONS.PATH;
  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  const skipImport = options.skipImport || DEFAULT_OPTIONS.SKIP_IMPORT;
  const flat = options.flat || DEFAULT_OPTIONS.FLAT;

  return {
    name,
    normalizedPath,
    skipImport,
    flat,
  };
}

/**
 * Gets the parent directory path by going up the specified number of levels
 *
 * @param path - Current path
 * @param levels - Number of levels to go up
 * @returns Parent path
 */
function getParentPath(path: string, levels: number): string {
  const normalizedPath = path.replace(/\/$/, ""); // Remove trailing slash
  const pathParts = normalizedPath.split("/").filter((part) => part !== "");

  // Remove the specified number of levels
  for (let i = 0; i < levels && pathParts.length > 0; i++) {
    pathParts.pop();
  }

  // Reconstruct path with trailing slash
  return pathParts.length > 0 ? pathParts.join("/") + "/" : "";
}

/**
 * Adds import statement to the module file
 *
 * @param content - Current module file content
 * @param importStatement - Import statement to add
 * @returns Updated content with new import
 */
function addImportStatement(content: string, importStatement: string): string {
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
function addProviderEntry(
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
 * Gets relative path from source to target
 *
 * @param from - Source path (directory)
 * @param to - Target path (file without extension)
 * @returns Relative path
 */
function getRelativePath(from: string, to: string): string {
  const fromParts = from
    .replace(/\/$/, "")
    .split("/")
    .filter((part) => part !== "");
  const toParts = to.split("/").filter((part) => part !== "");

  // Find common base
  let commonLength = 0;
  while (
    commonLength < fromParts.length &&
    commonLength < toParts.length &&
    fromParts[commonLength] === toParts[commonLength]
  ) {
    commonLength++;
  }

  // Calculate relative path
  const upLevels = fromParts.length - commonLength;
  const downPath = toParts.slice(commonLength);

  const relativeParts: string[] = [];

  // Add '../' for each level up
  for (let i = 0; i < upLevels; i++) {
    relativeParts.push("..");
  }

  // Add the down path
  relativeParts.push(...downPath);

  // Join and ensure it starts with './' if it's not going up
  const result = relativeParts.join("/");
  return result.startsWith("../") ? result : `./${result}`;
}

/**
 * Calculates the relative import path from module file to handler file
 *
 * @param modulePath - Path to the module file
 * @param handlerBasePath - Base path where handlers are created
 * @param name - Handler name
 * @param flat - Whether using flat structure
 * @returns Relative import path
 */
function calculateRelativeImportPath(
  modulePath: string,
  handlerBasePath: string,
  name: string,
  flat: boolean
): string {
  // Get the directory of the module file
  const moduleDir = modulePath.substring(0, modulePath.lastIndexOf("/") + 1);

  // Determine handler file location
  const handlerPath = flat
    ? `${handlerBasePath}${name}.handler`
    : `${handlerBasePath}handlers/${name}.handler`;

  // Calculate relative path from module directory to handler file
  const relativePath = getRelativePath(moduleDir, handlerPath);

  return relativePath;
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
    if (
      moduleContent.includes(importStatement) ||
      moduleContent.includes(`${strings.classify(name)}Handler`)
    ) {
      console.log(
        `Handler ${strings.classify(name)}Handler already exists in module`
      );
      return;
    }

    console.log(`Adding import: ${importStatement}`);
    console.log(`Adding provider: ${providerEntry}`);

    // Add import statement after existing imports
    const updatedImports = addImportStatement(moduleContent, importStatement);

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
    throw new SchematicsException(`Failed to update module file: ${error}`);
  }
}
