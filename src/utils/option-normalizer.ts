// Angular Devkit
import { strings } from "@angular-devkit/core";

// Types
import { GenerateOptions } from "../types";

const DEFAULT_OPTIONS = {
  PATH: "src",
  SKIP_IMPORT: false,
  FLAT: false,
} as const;

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
