/**
 * Constants for template definitions
 */
export const TEMPLATES = {
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
} as const;
