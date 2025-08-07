"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const template_1 = require("../utils/template");
/**
 * Constants for template definitions
 */
const TEMPLATES = {
    QUERY: `

  import { Query } from '@nestjs/cqrs';

export interface <%= classify(name) %>QueryPayload {
  id: string;
}

export class <%= classify(name) %>Query extends Query<any> {
  constructor(public readonly payload: <%= classify(name) %>QueryPayload) {
    super();
  }
}
`,
    HANDLER: `
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { <%= classify(name) %>Query } from '<%= importPath %>';

@QueryHandler(<%= classify(name) %>Query)
export class <%= classify(name) %>Handler implements IQueryHandler<<%= classify(name) %>Query, any> {
  constructor() {}

  async execute(query: <%= classify(name) %>Query): Promise<any> {
    const { payload } = query;
    return { result: null };
  }
}
`,
};
/**
 * Default values for query options
 */
const DEFAULT_OPTIONS = {
    PATH: "src",
    SKIP_IMPORT: false,
    FLAT: false,
};
/**
 * Angular schematic rule for generating NestJS CQRS query and handler files
 *
 * This schematic generates:
 * - A query class with payload interface
 * - A query handler implementing IQueryHandler
 * - Optionally updates the module file with the new handler
 *
 * @param _options - Configuration options for the schematic
 * @returns Rule function that applies the schematic transformations
 */
function query(_options) {
    return (tree, _context) => {
        try {
            // Validate required options
            if (!_options.name) {
                throw new schematics_1.SchematicsException("Query name is required");
            }
            // Normalize and extract options
            const options = normalizeOptions(_options);
            const { name, normalizedPath, skipImport, flat } = options;
            // Generate file contents from templates
            const queryContent = (0, template_1.processTemplate)(TEMPLATES.QUERY, { name });
            // Generate handler content with dynamic import path
            const importPath = flat ? `./${name}.query` : `../impl/${name}.query`;
            const handlerTemplate = TEMPLATES.HANDLER.replace("<%= importPath %>", importPath);
            const handlerContent = (0, template_1.processTemplate)(handlerTemplate, { name });
            // Create query and handler files
            createQueryFiles(tree, {
                name,
                normalizedPath,
                flat,
                queryContent,
                handlerContent,
            });
            // Update module file if not skipping import
            if (!skipImport) {
                updateModuleFile(tree, { name, normalizedPath, flat });
            }
            return (0, schematics_1.chain)([]);
        }
        catch (error) {
            throw new schematics_1.SchematicsException(`Failed to generate query: ${error}`);
        }
    };
}
/**
 * Normalizes and validates the input options
 *
 * @param options - Raw input options
 * @returns Normalized options with defaults applied
 */
function normalizeOptions(options) {
    const name = core_1.strings.dasherize(options.name);
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
 * Creates the query and handler files in the file system tree
 *
 * @param tree - The virtual file system tree
 * @param params - Parameters for file creation
 */
function createQueryFiles(tree, params) {
    const { name, normalizedPath, flat, queryContent, handlerContent } = params;
    // Determine target paths based on flat structure preference
    const queryPath = flat ? normalizedPath : `${normalizedPath}impl/`;
    const handlerPath = flat ? normalizedPath : `${normalizedPath}handlers/`;
    // Create query file
    const queryFilePath = `${queryPath}${name}.query.ts`;
    tree.create(queryFilePath, queryContent);
    // Create handler file
    const handlerFilePath = `${handlerPath}${name}.handler.ts`;
    tree.create(handlerFilePath, handlerContent);
}
/**
 * Finds the first .module.ts file in the ../../ directory relative to the current path
 *
 * @param tree - The virtual file system tree
 * @param currentPath - Current normalized path
 * @returns Path to the module file or null if not found
 */
function findModuleFile(tree, currentPath) {
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
            console.warn(`Multiple .module.ts files found in ${parentPath}:`, moduleFiles);
            console.warn(`Using the first one: ${moduleFiles[0]}`);
        }
        console.log(`Found module file: ${moduleFiles[0]}`);
        return moduleFiles[0];
    }
    catch (error) {
        console.warn(`Could not access directory ${parentPath}:`, error);
        return null;
    }
}
/**
 * Gets the parent directory path by going up the specified number of levels
 *
 * @param path - Current path
 * @param levels - Number of levels to go up
 * @returns Parent path
 */
function getParentPath(path, levels) {
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
 * Updates the module file to include the new query handler
 *
 * @param tree - The virtual file system tree
 * @param params - Parameters for module update
 */
function updateModuleFile(tree, params) {
    var _a;
    const { name, normalizedPath, flat } = params;
    // Find the module file in ../../
    const modulePath = findModuleFile(tree, normalizedPath);
    if (!modulePath) {
        console.warn("No module file found to update");
        return;
    }
    try {
        const moduleContent = (_a = tree.read(modulePath)) === null || _a === void 0 ? void 0 : _a.toString("utf-8");
        if (!moduleContent) {
            throw new schematics_1.SchematicsException(`Could not read module file: ${modulePath}`);
        }
        // Calculate relative import path from module to handler
        const relativeImportPath = calculateRelativeImportPath(modulePath, normalizedPath, name, flat);
        // Generate import and provider statements
        const importStatement = `import { ${core_1.strings.classify(name)}Handler } from '${relativeImportPath}';`;
        const providerEntry = `    ${core_1.strings.classify(name)}Handler,`;
        // Skip if import already exists
        if (moduleContent.includes(importStatement) ||
            moduleContent.includes(`${core_1.strings.classify(name)}Handler`)) {
            console.log(`Handler ${core_1.strings.classify(name)}Handler already exists in module`);
            return;
        }
        console.log(`Adding import: ${importStatement}`);
        console.log(`Adding provider: ${providerEntry}`);
        // Add import statement after existing imports
        const updatedImports = addImportStatement(moduleContent, importStatement);
        // Add provider to the providers array
        const updatedProviders = addProviderEntry(updatedImports, providerEntry, name);
        // Write updated content back to file
        tree.overwrite(modulePath, updatedProviders);
        console.log(`Successfully updated module file: ${modulePath}`);
    }
    catch (error) {
        throw new schematics_1.SchematicsException(`Failed to update module file: ${error}`);
    }
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
function calculateRelativeImportPath(modulePath, handlerBasePath, name, flat) {
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
 * Gets relative path from source to target
 *
 * @param from - Source path (directory)
 * @param to - Target path (file without extension)
 * @returns Relative path
 */
function getRelativePath(from, to) {
    const fromParts = from
        .replace(/\/$/, "")
        .split("/")
        .filter((part) => part !== "");
    const toParts = to.split("/").filter((part) => part !== "");
    // Find common base
    let commonLength = 0;
    while (commonLength < fromParts.length &&
        commonLength < toParts.length &&
        fromParts[commonLength] === toParts[commonLength]) {
        commonLength++;
    }
    // Calculate relative path
    const upLevels = fromParts.length - commonLength;
    const downPath = toParts.slice(commonLength);
    const relativeParts = [];
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
 * Adds import statement to the module file
 *
 * @param content - Current module file content
 * @param importStatement - Import statement to add
 * @returns Updated content with new import
 */
function addImportStatement(content, importStatement) {
    // Try to find the last import statement
    const importRegex = /import.*from\s+['"][^'"]+['"];/g;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
        // Find the last import and add after it
        const lastImport = imports[imports.length - 1];
        return content.replace(lastImport, `${lastImport}\n${importStatement}`);
    }
    else {
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
function addProviderEntry(content, providerEntry, name) {
    return content.replace(/providers:\s*\[([\s\S]*?)\]/m, (match, providers) => {
        // Check if provider already exists
        if (providers.includes(`${core_1.strings.classify(name)}Handler`)) {
            return match;
        }
        // Add new provider to the array
        const existingProviders = providers.trim();
        const separator = existingProviders && !existingProviders.endsWith(",") ? "," : "";
        return `providers: [${existingProviders}${separator}\n${providerEntry}\n  ]`;
    });
}
//# sourceMappingURL=query.js.map