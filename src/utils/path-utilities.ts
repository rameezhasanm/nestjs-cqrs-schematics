/**
 * Gets the parent directory path by going up the specified number of levels
 *
 * @param path - Current path
 * @param levels - Number of levels to go up
 * @returns Parent path
 */
export function getParentPath(path: string, levels: number): string {
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
 * Gets relative path from source to target
 *
 * @param from - Source path (directory)
 * @param to - Target path (file without extension)
 * @returns Relative path
 */
export function getRelativePath(from: string, to: string): string {
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
export function calculateRelativeImportPath(
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
