import type { withScalar } from './with-scalar';
import type { fromVariable } from './from-variable';

enum ExpectedType {
  node = 'node',
  nodeList = 'nodeList',
  connection = 'connection',
  edges = 'edges',
  record = 'record',
  scalar = 'scalar',
  negligible = 'negligible',
}

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

type ComplexFieldProps = {
  __scalars?: FieldName[];
  __params?: Record<string, unknown | ReturnType<typeof fromVariable>>;
} | {};

type ToLocalTypeProps = {
  __toLocalType?: string;
} | {}

type ObjectField = {
  [key in string]:
  | ScalarField
  | ObjectField
  | NodeField
  | ConnectionField
  | NodeListField
  | undefined;
} & AliasProps & DirectivesProps & ComplexFieldProps;

type NodeField = {
  __node: boolean;
} & ObjectField & ToLocalTypeProps;

type ConnectionField = {
  __connection: boolean;
  edges?: ObjectField | NodeListField;
} & {
    [key in string]?: ObjectField;
  } & AliasProps & DirectivesProps & ComplexFieldProps & ToLocalTypeProps;

type NodeListField = {
  __list: boolean;
} & ObjectField & ToLocalTypeProps;

type QueryField =
  | ScalarField
  | ObjectField
  | NodeField
  | ConnectionField
  | NodeListField;


type OperationBase = {
  __operationName?: string;
  __variables?: Record<string, ReturnType<typeof withScalar>>;
} & DirectivesProps;

type QueryOperation = OperationBase & {
  [key: FieldName]:
  | ScalarField
  | ObjectField
  | NodeField
  | ConnectionField
  | NodeListField;
};

type MutationOperation = OperationBase & {
  [key: FieldName]: ObjectField | NodeField | ConnectionField | NodeListField;
};

type SubscriptionOperation = MutationOperation;

type Fragment = {
  [key: FieldName]:
  | ScalarField
  | ObjectField
  | NodeField
  | ConnectionField
  | NodeListField;
} & {
  __variables?: Record<string, ReturnType<typeof withScalar>>;
  __fragmentName: string;
} & DirectivesProps;

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
  Fragment
};
export { ExpectedType };
