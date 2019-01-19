import { ApolloLink } from 'apollo-link';
import { GraphQLSchema } from 'graphql';

export interface ApolloIpcLinkOptions {
  channel?: string;
  ipc: any;
}

export interface SchemaLinkOptions {
  schema: GraphQLSchema;
  root?: any;
  context?: any;
}

export interface IpcExecutorOptions {
  link: ApolloLink;
  ipc: any;
  channel?: string;
}

export interface SerializableGraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
  context?: Record<string, any>;
  extensions?: Record<string, any>;
}
