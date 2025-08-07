// Angular Devkit
import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  SchematicsException,
} from "@angular-devkit/schematics";

// Interfaces
import { GenerateOptions as CommandOptions } from "../utils/interface";

// Templates
import { processTemplate } from "../utils/template";
import { COMMAND_TEMPLATES as TEMPLATES } from "./templates/command.template";

// Helpers
import { normalizeOptions, updateModuleFile } from "../utils/helpers";

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
        updateModuleFile(tree, { name, normalizedPath, flat });
      }

      return chain([]);
    } catch (error) {
      throw new SchematicsException(`Failed to generate command: ${error}`);
    }
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
