import { Rule } from "@angular-devkit/schematics";
/**
 * Options interface for the query schematic
 */
interface QueryOptions {
    name: string;
    path?: string;
    skipImport?: boolean;
    flat?: boolean;
}
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
export declare function query(_options: QueryOptions): Rule;
export {};
