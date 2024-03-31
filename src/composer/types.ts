import type { variable } from './variable';
import type { fromVariable } from './from-variable';
import type { Composer } from './composer';


enum ExpectedType {
  node = 'node',
  nodeList = 'nodeList',
  connection = 'connection',
  edges = 'edges',
  record = 'record',
  scalar = 'scalar',
  negligible = 'negligible',
};

type OperationType = 'query' | 'mutation' |'subscription';

type FieldName = string;

type Directive = {
  name: string;
  args?: {
    [argName: string]: unknown | ReturnType<typeof fromVariable>;
  };
};

type DirectivesProps = {
  __directives?: Directive[];
} | {};

type AliasProps = {
  __alias?: string | undefined;
} | {};

type ScalarField = {} | AliasProps | DirectivesProps;

type ComplexFieldProps<T extends string> = {
  __typename?: T
  __scalars?: FieldName[];
  __params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
  __fragments?: Fragment<T>['__fragmentName'][]
} | {};

type ToLocalTypeProps = {
  __toLocalType?: string;
} | {}

type ObjectField<T extends string> = {
  [key in string]:
  | ScalarField
  | ObjectField<T>
  | NodeField<T>
  | ConnectionField<T>
  | NodeListField<T>
  | undefined;
} & AliasProps & DirectivesProps & ComplexFieldProps<T>;

type NodeField<T extends string> = {
  __node: boolean;
} & ObjectField<T> & ToLocalTypeProps;

type ConnectionField<T extends string> = {
  __connection: boolean;
  edges?: ObjectField<T> | NodeListField<T>;
} & {
    [key in string]?: ObjectField<T>;
  } & AliasProps & DirectivesProps & ComplexFieldProps<T> & ToLocalTypeProps;

type NodeListField<T extends string> = {
  __list: boolean;
} & ObjectField<T> & ToLocalTypeProps;

type QueryField =
  | ScalarField
  | ObjectField<string>
  | NodeField<string>
  | ConnectionField<string>
  | NodeListField<string>;


type OperationBase = {
  __operationName?: string;
  __variables?: Record<string, ReturnType<typeof variable>>;
} & DirectivesProps;

type QueryOperation = OperationBase & {
  [key: FieldName]:
  | ScalarField
  | ObjectField<string>
  | NodeField<string>
  | ConnectionField<string>
  | NodeListField<string>;
};

type MutationOperation = OperationBase & {
  [key: FieldName]:
  | ObjectField<string>
  | NodeField<string>
  | ConnectionField<string>
  | NodeListField<string>;
};

type SubscriptionOperation = MutationOperation;

type Fragment<T extends string> = {
  [key: FieldName]:
  | ScalarField
  | ObjectField<T>
  | NodeField<T>
  | ConnectionField<T>
  | NodeListField<T>;
} & {
  __fragmentName: string;
  __typename: T;
  __scalars?: FieldName[];
  __fragments?: Fragment<T>['__fragmentName'][]
};

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

type OperationBuilder = (type: OperationType, operation: QueryOperation | MutationOperation | SubscriptionOperation) => ConfiguredOperationHandler;

type OperationHandler = (composer: Composer) => string;

type ConfiguredOperationHandler = OperationHandler & {
  isComposer: boolean,
  operationName: string
  isFragment?: false
}

export type {
  QueryField,
  ScalarField,
  ObjectField,
  NodeField,
  NodeListField,
  ConnectionField,
  Expectation,
  Directive,
  QueryOperation,
  MutationOperation,
  SubscriptionOperation,
  FieldName,
  ComplexFieldProps,
  Fragment,
  OperationBuilder,
  OperationHandler,
  ConfiguredOperationHandler,
  OperationType,
};
export { ExpectedType };
