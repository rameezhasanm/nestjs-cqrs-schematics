/**
 * Constants for template definitions
 */
export const COMMAND_TEMPLATES = {
  COMMAND: `

import { Command } from '@nestjs/cqrs';

export interface <%= classify(name) %>CommandPayload {
  name: string;
  description?: string;
}

export class <%= classify(name) %>Command extends Command<any> {
  constructor(public readonly payload: <%= classify(name) %>CommandPayload) {
    super();
  }
}
`,
  HANDLER: `
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { <%= classify(name) %>Command } from '<%= importPath %>';

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
