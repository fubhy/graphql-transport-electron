# graphql-transport-electron

## Why

In case you want to run a graphql server inside of the Electron main process (for instance
if you are building a decentralized application), you need to have the client (renderer process)
and server (main process) communicate through Electron IPC.

This project provides a very lightweight client and server interface for Electron IPC based on
Apollo.

While its primary use-case is to enable a self-sustained and isolated graphql server inside of
the Electron main process, you can connect the server interface to any ApolloLink instance.
This means that you could also connect it with a HttpLink / WsLink that forwards your queries
to a hosted graphql server outside of Electron.

## Installation

```
# With yarn
yarn add graphql-transport-electron

# With npm
npm install graphql-transport-electron
```

## Usage example

### Main process

```typescript
import { ipcMain } from 'electron';
// NOTE: The library ships with a fork of apollo-link-schema that also supports subscriptions.
import { createSchemaLink, createIpcExecutor } from 'graphql-transport-electron';
import schema from './my-graphql-schema';

// NOTE: This also works with any other apollo link (e.g. HttpLink from apollo-link).
const link = createSchemaLink({ schema });
createIpcExecutor({link, ipc: ipcMain });
```

### Renderer process

```typescript
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ipcRenderer } from 'electron';
import { createIpcLink } from 'graphql-transport-electron';

const link = createIpcLink({ ipc: ipcRenderer });
const client = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});

```
