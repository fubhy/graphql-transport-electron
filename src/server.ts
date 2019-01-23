import {
  SerializableGraphQLRequest,
  SchemaLinkOptions,
  IpcExecutorOptions,
} from './types';
import { createAsyncIterator, forAwaitEach, isAsyncIterable } from 'iterall';
import { getMainDefinition } from 'apollo-utilities';
import {
  ApolloLink,
  FetchResult,
  Observable,
  execute as executeLink,
} from 'apollo-link';
import { parse, execute, subscribe } from 'graphql';

const isSubscription = query => {
  const main = getMainDefinition(query);
  return (
    main.kind === 'OperationDefinition' && main.operation === 'subscription'
  );
};

const ensureIterable = data => {
  if (isAsyncIterable(data)) {
    return data;
  }

  return createAsyncIterator([data]);
};

type Executor = typeof execute | typeof subscribe;

export const createSchemaLink = (options: SchemaLinkOptions) => {
  return new ApolloLink(request => {
    return new Observable<FetchResult>(observer => {
      const executor: Executor = isSubscription(request.query)
        ? subscribe
        : execute;

      const context =
        typeof options.context === 'function'
          ? options.context(request)
          : options.context;

      const result = (executor as any)(
        options.schema,
        request.query,
        options.root,
        context,
        request.variables,
        request.operationName,
      );

      (async () => {
        try {
          const iterable = ensureIterable(await result);
          await forAwaitEach(iterable, value => observer.next(value));
          observer.complete();
        } catch (error) {
          observer.error(error);
        }
      })();
    });
  });
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
      error => event.sender.send(channel, id, 'error', error),
      () => event.sender.send(channel, id, 'complete'),
    );
  };

  options.ipc.on(channel, listener);

  return () => {
    options.ipc.removeListener(channel, listener);
  };
};

export { IpcLink, createIpcLink } from './client';
