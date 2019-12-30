import { ApolloLink, Observable, Operation, FetchResult } from 'apollo-link';
import { IpcRenderer } from 'electron';
import { print } from 'graphql';
import { ApolloIpcLinkOptions, SerializableGraphQLRequest } from './types';
import { ZenObservable } from 'zen-observable-ts';
import { deserializeError } from 'serialize-error';

export class IpcLink extends ApolloLink {
  private ipc: IpcRenderer;
  private counter: number = 0;
  private channel: string = 'graphql';
  private observers: Map<string, ZenObservable.SubscriptionObserver<FetchResult>> = new Map();

  constructor(options: ApolloIpcLinkOptions) {
    super();

    this.ipc = options.ipc;
    if (typeof options.channel !== 'undefined') {
      this.channel = options.channel;
    }

    this.ipc.on(this.channel, this.listener);
  }

  public request(operation: Operation) {
    return new Observable((observer: ZenObservable.SubscriptionObserver<FetchResult>) => {
      const current = `${++this.counter}`;
      const request: SerializableGraphQLRequest = {
        operationName: operation.operationName,
        variables: operation.variables,
        query: print(operation.query),
        context: operation.getContext(),
      };

      this.observers.set(current, observer);
      this.ipc.send(this.channel, current, request);
    });
  }

  protected listener = (event, id, type, data) => {
    if (!this.observers.has(id)) {
      console.error(`Missing observer for query id ${id}.`);
    }

    const observer = this.observers.get(id);
    switch (type) {
      case 'data':
        return observer && observer.next(data);

      case 'error': {
        this.observers.delete(id);
        return observer && observer.error(deserializeError(data));
      }

      case 'complete': {
        this.observers.delete(id);
        return observer && observer.complete();
      }
    }
  };

  public dispose() {
    this.ipc.removeListener(this.channel, this.listener);
  }
}

export const createIpcLink = (options: ApolloIpcLinkOptions) => {
  return new IpcLink(options);
};
