# Graphaella

Small robust SDK for generating GraphQL queries.

## Table of Contents

- [Graphaella](#graphaella)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage example](#usage-example)
  - [API](#api)
    - [`compose`](#compose)
    - [`operation`](#operation)
    - [`fragment`](#fragment)
    - [`variable`](#variable)
    - [`fromVariable`](#fromvariable)
    - [Expectation](#expectation)
  - [Available flags](#available-flags)
    - [Operation level](#operation-level)
    - [Field level](#field-level)
    - [Field level expectation related flags](#field-level-expectation-related-flags)
  - [TODO](#todo)
  - [License](#license)

## Features

- Infers a clear api of expected from the server data allowing easy serialization capability for caching in ORMs and data managing libraries, like ember-data.
- Small in size and no runtime dependencies at all (not even graphql)
- Works with any client
- supports typescript
- suports aliasing
- supports static variables
- supports typed variables
- supports directives
- no plugins or much configuration
- supports generation of multiple operations for batching

## Installation

Simply add the package to your repo and import from `src`.
Installation via npm will be available soon.

## Usage example

Let's see the following example:

```ts
import { compose, query, variable } from 'graphaella';

const {document, getExpectation } = compose(query({
  __operationName: 'UsersQuery',
  __variables: {
    token: variable('skajdhaskjdh-kjsdha-askdhsakldjh', 'String', true),
    addedDate: variable(Date.now().toString(), 'Date', false),
    includeFriends: variable(true, 'Boolean', false)
  },
  __directives: [
    {
      name: 'auth',
      args: {
        token: fromVariable('token')
      }
    }
  ],
  users: {
    __connection: true,
    edges: {
      node: {
        __toLocalType: 'User',
        __scalars: ['id', 'name', 'email', '__typename'],
        friendsConnection: {
          __alias: 'recentFriends',
          __params: {
            addedDate: fromVariable('addedDate')
          },
          __directives: [
            {
              name: 'inlcude',
              args: {
                if: fromVariable('includeFriends')
              }
            }
          ],
          edges: {
            node: {
              __scalars: ['id', 'name', 'email', '__typename'],
            },
            __scalars: ['cursor']
          },
          pageInfo: {
            __scalars: ['hasNextPage', 'hasPreviousPage'],
          }
        }
      }
    }
  }
}));
```

will return:

```json
{
  "operationName": "UserQuery",
  "query": "query UsersQuery ($token: String!, $addedDate: Date, $includeFriends: Boolean) @auth(token: $token) {   users   {   edges   {   node   { id name email __typename  recentFriends: friendsConnection (addedDate: $addedDate) @inlcude(if: $includeFriends) {   edges   { cursor  node   { id name email __typename  } }  pageInfo   { hasNextPage hasPreviousPage  } } } } } }",
  "variables": {
    "token": "skajdhaskjdh-kjsdha-askdhsakldjh", 
    "addedDate": "1711795343609", 
    "includeFriends": true
  }
}
```

For more examples see operations.ts in `examples` folder.

## API

Offers following tools for GraphQL generation

### `compose`

Main composer function and starting point for document generation. It sets up a composer, and scrambles GraphQl source documents. Returns an array contianing operation objects; is batching ready;

### `operation`

Used as argument to `compose`, essentially wraps the passed declaration object into a query, mutation or subscription operation with respective operation variables and possible directives. accepts two arguments, the type of the operation (`query`, `mutation` or `subscription`) and the `operation` object.

### `fragment`

Used as argument to `compose`, essentially composes a block fragment and makes it available to all operations of `compose`. In the operation `__fragments` flag can be used to list the fragment names to be included. Allows nesting fragments.

### `variable`

A function to declare a typed operation variables and programmatically map them to the queryParams or input. Has 3 arguments: `(value: unknown, scalarTypeName: string, non_nullable: boolean)`. scalarTypeName is the string representation of the scalar type.

### `fromVariable`

A function that accepts the variable name and uses the __variables declared on current level to properly map the variable name.

### Expectation

An expectation object has following type signature:

```ts
type Expectation = {
  responseKey: string; // the key on response: i.e. dataKey or alias
  key: FieldName; // the actual key
  path: (string | '#')[]; // for easy error retrival on response // TODO: DEPRECATE, was not necessary in serializer
  level: number;
  alias?: string;
} & (
    | {
      type: ExpectedType.node;
      localTypeName: string;
      params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
    } | {
      type: ExpectedType.connection;
      localTypeName: string;
      params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
    } | {
      type: ExpectedType.edges;
      localTypeName: string;
      params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
    } | {
      type: ExpectedType.nodeList;
      localTypeName: string;
      params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
    } | {
      type: ExpectedType.record;
      params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
    } | {
      type: ExpectedType.scalar;
      localTypeName: string;
    } | {
      type: ExpectedType.negligible;
    }
  );
```

## Available flags

### Operation level

- `__operationName`: allows customizing of the operation name will default to empty string.
- `__variables`: an object containing a key value pair of variables, where values are declared using 'variable' function.
- `__diretcives`: an array containing directive objects: a directive object must have a 'name' and may have 'args' object.

### Field level

- `__directives`: same as operation level directives.
- `__alias`: a field alias.
- `__scalars`: an array of field names to be included; as in GraphQL they need to be explicitly defined.
- `__params`: an object containing field params;
- `__fragments`: an array containing the names of fragments to be used in the operation.

### Field level expectation related flags

- `__toLocalType`: allows defining a typename on the expectation object for later usage in serialization. This can be used for easy mapping of the response to the client side different schema independently from server-side '__typename'.
- `__node`, `__list`, `__connection`: allows to declarativly specify the expected structure type. `__list` is for fields that return flat array of nodes.

## TODO

- integration with newest ember-data
- generator of queries, mutations and subscriptions from introspection
- persisted generation of source and expectations

## License

MIT: See LICENSE
