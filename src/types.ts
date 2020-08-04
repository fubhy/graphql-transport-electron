import { ApolloLink } from '@apollo/client';
import { GraphQLSchema } from 'graphql';
import { IpcRenderer, IpcMain } from 'electron';

export interface ApolloIpcLinkOptions<TContext = any> {
  channel?: string;
  ipc: IpcRenderer;
  contextSerializer: (context: TContext) => any;
}

export interface SchemaLinkOptions<TContext = any, TRoot = any> {
  schema: GraphQLSchema;
  root?: TRoot;
  context?: TContext;
}

export interface IpcExecutorOptions {
  link: ApolloLink;
  ipc: IpcMain;
  channel?: string;
}

export interface SerializableGraphQLRequest<TContext = any, TVariables = any, TExtensions = any> {
  query: string;
  operationName?: string;
  variables?: TVariables;
  context?: TContext;
  extensions?: TExtensions;
}
