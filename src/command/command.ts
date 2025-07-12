import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  SchematicsException,
} from "@angular-devkit/schematics";
import { strings } from "@angular-devkit/core";
import { processTemplate } from "../utils/template";

/**
 * Options interface for the command schematic
 */
interface CommandOptions {
  name: string;
  path?: string;
  skipImport?: boolean;
  flat?: boolean;
}

/**
 * Constants for template definitions
 */
const TEMPLATES = {
  COMMAND: `
export interface <%= classify(name) %>CommandPayload {
  name: string;
  description?: string;
}

export class <%= classify(name) %>Command {
  constructor(public readonly payload: <%= classify(name) %>CommandPayload) {}
}
`,
  HANDLER: `
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { <%= classify(name) %>Command, <%= classify(name) %>CommandPayload } from '<%= importPath %>';

@CommandHandler(<%= classify(name) %>Command)
export class <%= classify(name) %>Handler implements ICommandHandler<<%= classify(name) %>Command> {
  constructor() {}

  async execute(command: <%= classify(name) %>Command): Promise<any> {
    const { payload } = command;
    return { success: true };
  }
}
`,
} as const;

/**
 * Default values for command options
 */
const DEFAULT_OPTIONS = {
  PATH: "src",
  SKIP_IMPORT: false,
  FLAT: false,
} as const;

/**
 * Angular schematic rule for generating NestJS CQRS command and handler files
 *
 * This schematic generates:
 * - A command class with payload interface
 * - A command handler implementing ICommandHandler
 * - Optionally updates the module file with the new handler
 *
 * @param _options - Configuration options for the schematic
 * @returns Rule function that applies the schematic transformations
 */
export function command(_options: CommandOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    try {
      // Validate required options
      if (!_options.name) {
        throw new SchematicsException("Command name is required");
      }

      // Normalize and extract options
      const options = normalizeOptions(_options);
      const { name, normalizedPath, skipImport, flat } = options;

      // Generate file contents from templates
      const commandContent = processTemplate(TEMPLATES.COMMAND, { name });

      // Generate handler content with dynamic import path
      const importPath = flat ? `./${name}.command` : `../impl/${name}.command`;
      const handlerTemplate = TEMPLATES.HANDLER.replace(
        "<%= importPath %>",
        importPath
      );
      const handlerContent = processTemplate(handlerTemplate, { name });

      // Create command and handler files
      createCommandFiles(tree, {
        name,
        normalizedPath,
        flat,
        commandContent,
        handlerContent,
      });

      // Update module file if not skipping import
      if (!skipImport) {
        updateModuleFile(tree, { name, normalizedPath });
      }

      return chain([]);
    } catch (error) {
      throw new SchematicsException(`Failed to generate command: ${error}`);
    }
  };
}

/**
 * Normalizes and validates the input options
 *
 * @param options - Raw input options
 * @returns Normalized options with defaults applied
 */
function normalizeOptions(options: CommandOptions) {
  const name = strings.dasherize(options.name);
  const path = options.path || DEFAULT_OPTIONS.PATH;
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
 * Creates the command and handler files in the file system tree
 *
 * @param tree - The virtual file system tree
 * @param params - Parameters for file creation
 */
function createCommandFiles(
  tree: Tree,
  params: {
    name: string;
    normalizedPath: string;
    flat: boolean;
    commandContent: string;
    handlerContent: string;
  }
) {
  const { name, normalizedPath, flat, commandContent, handlerContent } = params;

  // Determine target paths based on flat structure preference
  const commandPath = flat ? normalizedPath : `${normalizedPath}impl/`;
  const handlerPath = flat ? normalizedPath : `${normalizedPath}handlers/`;

  // Create command file
  const commandFilePath = `${commandPath}${name}.command.ts`;
  tree.create(commandFilePath, commandContent);

  // Create handler file
  const handlerFilePath = `${handlerPath}${name}.handler.ts`;
  tree.create(handlerFilePath, handlerContent);
}

/**
 * Updates the module file to include the new command handler
 *
 * @param tree - The virtual file system tree
 * @param params - Parameters for module update
 */
function updateModuleFile(
  tree: Tree,
  params: {
    name: string;
    normalizedPath: string;
  }
) {
  const { name, normalizedPath } = params;
  const modulePath = `${normalizedPath}users.module.ts`;

  // Check if module file exists
  if (!tree.exists(modulePath)) {
    return; // Skip if module file doesn't exist
  }

  try {
    const moduleContent = tree.read(modulePath)?.toString("utf-8");

    if (!moduleContent) {
      throw new SchematicsException(
        `Could not read module file: ${modulePath}`
      );
    }

    // Generate import and provider statements
    const importStatement = `import { ${strings.classify(
      name
    )}Handler } from './handlers/${name}.handler';`;
    const providerEntry = `    ${strings.classify(name)}Handler,`;

    // Skip if import already exists
    if (moduleContent.includes(importStatement)) {
      return;
    }

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
  } catch (error) {
    throw new SchematicsException(`Failed to update module file: ${error}`);
  }
}

/**
 * Adds import statement to the module file
 *
 * @param content - Current module file content
 * @param importStatement - Import statement to add
 * @returns Updated content with new import
 */
function addImportStatement(content: string, importStatement: string): string {
  return content.replace(
    /import.*from '@nestjs\/common'.*;/,
    `$&\n${importStatement}`
  );
}

/**
 * Adds provider entry to the providers array in the module file
 *
 * @param content - Current module file content
 * @param providerEntry - Provider entry to add
 * @param name - Command name for duplicate checking
 * @returns Updated content with new provider
 */
function addProviderEntry(
  content: string,
  providerEntry: string,
  name: string
): string {
  return content.replace(/providers: \[([\s\S]*?)\]/, (match, providers) => {
    // Check if provider already exists
    if (providers.includes(`${strings.classify(name)}Handler`)) {
      return match;
    }

    // Add new provider to the array
    const existingProviders = providers.trim();
    const separator = existingProviders ? "," : "";

    return `providers: [${existingProviders}${separator}\n${providerEntry}\n  ]`;
  });
}
