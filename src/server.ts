import { SerializableGraphQLRequest, SchemaLinkOptions, IpcExecutorOptions } from './types';
import { createAsyncIterator, forAwaitEach, isAsyncIterable } from 'iterall';
import { getMainDefinition } from 'apollo-utilities';
import { ApolloLink, FetchResult, Observable, execute as executeLink, Operation } from 'apollo-link';
import { parse, execute, subscribe, ExecutionArgs } from 'graphql';
import { serializeError } from 'serialize-error';

const isSubscription = query => {
  const main = getMainDefinition(query);
  return main.kind === 'OperationDefinition' && main.operation === 'subscription';
};

const ensureIterable = data => {
  if (isAsyncIterable(data)) {
    return data;
  }

  return createAsyncIterator([data]);
};

export const createSchemaLink = <TRoot = any>(options: SchemaLinkOptions) => {
  const handleRequest = async (request: Operation, observer: any) => {
    try {
      const context = options.context && (await options.context(request));
      const args: ExecutionArgs = {
        schema: options.schema,
        rootValue: options.root,
        contextValue: context,
        variableValues: request.variables,
        operationName: request.operationName,
        document: request.query,
      };

      const result = isSubscription(request.query) ? subscribe(args) : execute(args);
      const iterable = ensureIterable(await result) as AsyncIterable<any>;
      await forAwaitEach(iterable, (value: any) => observer.next(value));
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  };

  const createObservable = (request: Operation) => {
    return new Observable<FetchResult>(observer => {
      handleRequest(request, observer);
    });
  };

  return new ApolloLink(request => createObservable(request));
};

export const createIpcExecutor = (options: IpcExecutorOptions) => {
  const channel = options.channel || 'graphql';
  const listener = (event, id, request: SerializableGraphQLRequest) => {
    const result: Observable<FetchResult> = executeLink(options.link, {
      ...request,
      query: parse(request.query),
    });

    return result.subscribe(
      data => event.sender.send(channel, id, 'data', data),
      error => event.sender.send(channel, id, 'error', serializeError(error)),
      () => event.sender.send(channel, id, 'complete'),
    );
  };

  options.ipc.on(channel, listener);

  return () => {
    options.ipc.removeListener(channel, listener as any);
  };
};

export { IpcLink, createIpcLink } from './client';
