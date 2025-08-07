// Angular Devkit
import {
  Rule,
  SchematicContext,
  Tree,
  chain,
  SchematicsException,
} from "@angular-devkit/schematics";

// Templates
import { processTemplate } from "../utils/template";
import { TEMPLATES } from "./templates/query.template";

// Interfaces
import { GenerateOptions as QueryOptions } from "../utils/interface";

// Helpers
import { normalizeOptions, updateModuleFile } from "../utils/helpers";

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
export function query(_options: QueryOptions): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    try {
      // Validate required options
      if (!_options.name) {
        throw new SchematicsException("Query name is required");
      }

      // Normalize and extract options
      const options = normalizeOptions(_options);
      const { name, normalizedPath, skipImport, flat } = options;

      // Generate file contents from templates
      const queryContent = processTemplate(TEMPLATES.QUERY, { name });

      // Generate handler content with dynamic import path
      const importPath = flat ? `./${name}.query` : `../impl/${name}.query`;
      const handlerTemplate = TEMPLATES.HANDLER.replace(
        "<%= importPath %>",
        importPath
      );
      const handlerContent = processTemplate(handlerTemplate, { name });

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

      return chain([]);
    } catch (error) {
      throw new SchematicsException(`Failed to generate query: ${error}`);
    }
  };
}

/**
 * Creates the query and handler files in the file system tree
 *
 * @param tree - The virtual file system tree
 * @param params - Parameters for file creation
 */
function createQueryFiles(
  tree: Tree,
  params: {
    name: string;
    normalizedPath: string;
    flat: boolean;
    queryContent: string;
    handlerContent: string;
  }
) {
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
