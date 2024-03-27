import type { withScalar } from './with-scalar';
import type { fromVariable } from './from-variable';

const DASHERIZED_KEYS = [
  '__alias',
  '__directives',
  '__scalars',
  '__queryParams',
  '__toLocalType',
  '__node',
  '__list',
  '__connection',
] as const;

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
};

type AliasProps = {
  __alias?: string | undefined;
};

type ScalarField = {} | AliasProps | DirectivesProps;

interface ComplexFieldProps {
  __scalars?: FieldName[];
  __variables?: Record<string, ReturnType<typeof withScalar> | unknown>;
}

interface ToLocalTypeProps {
  __toLocalType: string;
}

type ObjectField = {
  [key in string]:
    | ScalarField
    | ObjectField
    | NodeField
    | ConnectionField
    | NodeListField
    | undefined;
} & (AliasProps | DirectivesProps | ComplexFieldProps);

type NodeField = ObjectField &
  ToLocalTypeProps & {
    __node: boolean;
  };

type ConnectionField = {
  [key in string]: ObjectField | undefined;
} & (AliasProps | DirectivesProps | ComplexFieldProps) &
  ToLocalTypeProps & {
    __connection: boolean;
    edges?: ObjectField | NodeListField;
  };

type NodeListField = ObjectField &
  ToLocalTypeProps & {
    __list: boolean;
  };

type QueryField =
  | ScalarField
  | ObjectField
  | NodeField
  | ConnectionField
  | NodeListField;

type QueryOperation = {
  [key: FieldName]:
    | ScalarField
    | ObjectField
    | NodeField
    | ConnectionField
    | NodeListField;
} & {
  __directiveParams?: Record<string, ReturnType<typeof withScalar> | unknown>;
  __operationName?: string,
} & DirectivesProps;

type MutationOperation = {
  [key: FieldName]:
    | ObjectField
    | NodeField
    | ConnectionField
    | NodeListField;
} & {
  __directiveParams?: Record<string, ReturnType<typeof withScalar> | unknown>;
  __operationName?: string,
} & DirectivesProps;

// TODO: implement subscription on composer
type SubscriptionOperation = MutationOperation;

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
      type: ExpectedType.nodeList;
      localTypeName: string;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.record;
      variables?: Record<string, ReturnType<typeof withScalar>>;
    }
  | {
      type: ExpectedType.scalar;
      localTypeName: string;
    }
  | {
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
};
export { ExpectedType };
