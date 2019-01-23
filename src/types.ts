import { ApolloLink } from 'apollo-link';
import { GraphQLSchema } from 'graphql';
import { IpcRenderer, IpcMain } from 'electron';

export interface ApolloIpcLinkOptions {
  channel?: string;
  ipc: IpcRenderer;
}

export interface SchemaLinkOptions {
  schema: GraphQLSchema;
  root?: any;
  context?: any;
}

export interface IpcExecutorOptions {
  link: ApolloLink;
  ipc: IpcMain;
  channel?: string;
}

export interface SerializableGraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
  context?: Record<string, any>;
  extensions?: Record<string, any>;
}
