import { Rule } from "@angular-devkit/schematics";
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
export declare function command(_options: CommandOptions): Rule;
export {};
