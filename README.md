# Graphaella

Small robust SDK for generating GraphQL queries.

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

## Installation

coming soon

## Usage

Let's see the following example:

```ts
import { compose, query, withScalar } from '@grapahaella/composer';
import { request } from 'graphql-request';

const {document, getExpectation } = compose(query(
{
  node: {
    age: {
      __alias: 'yearsLived' // aliased scalar field
    },
    friendsConnection: {
      __toLocalType: 'user', // for serialization via expectation to local type
      __alias: 'mates',
      __variables: {
        name__icontains: "John",
        includeFriends: withScalar(true, 'Boolean', false) // passing typed variables
      },
      __connection: true, // for serialization via expectation to connection
      __scalars: ['id', '__typename'],
      __directives: [
        {
          name: 'include',
          args: {
            if: fromVariable('includeFriends') // select from typed variables
          }
        }
      ]
    },
    __scalars: ['id', '__typename'],
    __variables: {
        id: withScalar('lkasjdLKSAD12klajsda', 'ID', true),
    },
    __alias: "userNode",
    __toLocalType: 'user',
    },
    __operationName: 'UserQuery' // ability to customize operation name
  }
));
```

will return:

```ts
{
  operationName: "UserQuery",
  query: `query UserQuery ($id1_1: ID!, $includeFriends2_3: Boolean)  {
    userNode: node (id: $id1_1)  { 
      id 
      __typename 
      yearsLived: age 
      mates: friends (name__icontains: "John", includeFriends: $includeFriends2_3) @include(if: $includeFriends2_3) { 
        id 
        __typename  
      } 
    }
  }`,
  variables: {id1_1: "lkasjdLKSAD12klajsda", includeFriends2_3: true}
}
```

## API

Offers following tools for GraphQL generation

### `compose`

Main composer function and starting point for document generation. It sets up a composer, and scrambles GraphQl source document.

### `query`

Used as argument to `compose`, essentially wraps the passed declaration object into a query operation with respective operation variables and possible directives.

### `mutation`

Used as argument to `compose`, essentially wraps the passed declaration object into a mutation operation with respective operation variables and possible directives.

### `subscription`

Used as argument to `compose`, essentially wraps the passed declaration object into a subscription operation with respective operation variables and possible directives.

### `withScalar`

A helper function to declare a typed operation variables and programmatically map them to the queryParams or input. Has 3 arguments: `(value: unknown, scalarTypeName: string | Object, non_nullable: boolean)`. scalarTypeName can be a string or a custom `Object`: n.b. if `scalarTypeName` is a custom class its `constructor.name` will be used for string representation.

### `fromVariables`

A helper function that accepts the variable name and uses the __variables declared on current level to properly map the variable name.

### Expectation

An expectation object has following type:

```ts
type Expectation = {
  responseKey: string; // the key on response: e.g. the aliased field if it is aliased
  key: FieldName; // the actual key on schema
  path: (string | '#')[]; // for easy path retrival on response, if needed; '#' serves as indicator of a index of an array 
  level: number; // nesting level, useful for serialization
  alias?: string;
} & (
  | {
      type: ExpectedType.node;
      localTypeName: string;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.connection;
      localTypeName: string;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.edges;
      localTypeName: string;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.nodeList; // for responses with flat collections
      localTypeName: string;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.record;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.scalar;
      localTypeName: string; // the __typename of local schema, essentially allowing to map server side schema to a different client-side schema
    }
  | {
      type: ExpectedType.negligible; // the dev may neglect the return type, useful e.g. for login or logout fields
    }
);
```

## TODO

- fragments
- generator of queries, mutations and subscriptions from introspection
- integration with newest ember-data
- support for batching with compose
- persisted generation of source and expectations

## License

MIT: See LICENSE
