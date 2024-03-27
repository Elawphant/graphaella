import { assert } from './assert';
import type { fromVariable } from './from-variable';
import {
  type Directive,
  type Expectation,
  type NodeListField,
  type ObjectField,
  type QueryField,
  ExpectedType,
  type FieldName,
} from './types';
import { withScalar } from './with-scalar';

type Level = number;
type VariableIndex = number

/**
 * Class responsible for managing composables.
 * 
 * Is instantiated with an operation name.
 * 
 * Main method is `resolveFields`, which will compose a graphql source document 
 * from the provided configuration and scramble an expectation object representing 
 * what is expected from the GraphQL server response.
 * Composables `query`, `mutation`, `subscription` and `compose` use composer's methods 
 * for directives, operation variables, and final output.
 */
class Composer {
  /** 
   * A map holding the Expectation objects. 
   * The key represents a string of `${expectation.responseKey}:${expectation.level}` 
   * structure for easy deserialization access.
   */
  private declare readonly expectations: Map<string, Expectation>;

  public declare readonly operationName: string;

  private declare lastVariableIndex: number;

  private declare readonly operationVariables: Map<
    `${Level}_${VariableIndex}`,
    ReturnType<ReturnType<typeof withScalar>>
  >;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.expectations = new Map();
    this.operationVariables = new Map();
    this.lastVariableIndex = 0;
  };

  /**
   * Resolves a field declaration object into a GraphQl source piece representing the fields on the operation, 
   * while inferring and registering expectations
   * ---
   * @param key the field name being queried on the GraphQL server
   * @param field the declarative object that contains description of the queried field
   * @param path an array of strings describing the path to the field. '#' in the path describes an expected index in a response array
   * @param level the level for the current field. Levels start from 0 for each operation
   * @param enforceLocalType the name of the local type: used in expectation generation to pass the local type from connection to edge and node
   * to facilitate wordiness of declarations via inferring of local types
   * @returns a piece of GraphQl source representing the fields on the operation
   */
  public resolveFields = (
    key: string,
    field: QueryField,
    path: string[],
    level: number,
    enforceLocalType?: string,
  ): string => {
    assert(
      `Fields must be declared via objects or using '__scalars'`,
      typeof field === 'object' && !Array.isArray(field),
    );

    const {
      __alias,
      __connection,
      __directives,
      __edges,
      __list,
      __node,
      __toLocalType,
      __variables,
      __input,
      __scalars,
      ...fields
    } = field as QueryField & {
      __alias?: string;
      __connection?: boolean;
      __directives?: Directive[];
      __edges: ObjectField | NodeListField;
      __list: boolean;
      __node: boolean;
      __toLocalType?: string;
      __variables?: Record<string, ReturnType<typeof withScalar>>;
      __input?: Record<string, ReturnType<typeof withScalar>>;
      __scalars?: FieldName[];
      __directiveParams?: Record<string, ReturnType<typeof withScalar>>
    };

    const responseKey = __alias ? __alias : key;
    const __path =
      key === 'edges' || __edges || __list
        ? [...path, responseKey, '#']
        : [...path, responseKey];

    let expectationType: ExpectedType;

    switch (true) {
      // connection
      case __toLocalType !== undefined &&
        (key.includes('Connection') ||
          key.includes('connection') ||
          __connection === true):
        expectationType = ExpectedType.connection;
        break;
      // flat node list
      case (__toLocalType !== undefined || enforceLocalType !== undefined) &&
        __list === true:
        expectationType = ExpectedType.nodeList;
        break;
      // edges
      // in case server responds with spec non complient key, use __edges to correct the expected response
      case ((__toLocalType !== undefined || enforceLocalType !== undefined) &&
        key === 'edges') ||
        __edges:
        expectationType = ExpectedType.edges;
        break;
      // node
      case ((__toLocalType !== undefined || enforceLocalType !== undefined) &&
        key === 'node') ||
        key.includes('Node') ||
        key.includes('node') ||
        __node === true:
        if (__toLocalType && enforceLocalType) {
          assert(
            `'__toLocalType' on node must be ommited or be the same as on the containing list or connection`,
            __toLocalType === enforceLocalType,
          );
        }
        expectationType = ExpectedType.node;
        break;
      // object without localTypeName
      case __toLocalType === undefined &&
        enforceLocalType === undefined &&
        (Object.keys(fields).length > 0 || __variables !== undefined || __input !== undefined || __scalars !== undefined):
        expectationType = ExpectedType.record;
        break;
      // scalar field of node
      case __toLocalType === undefined && Object.keys(fields).length === 0 && __variables === undefined &&
        __scalars === undefined || __input === undefined:
        expectationType = ExpectedType.scalar;
        break;
      // scalar field of object without localTypeName
      default:
        expectationType = ExpectedType.negligible;
        break;
    };

    this.registerExpectation({
      responseKey: responseKey,
      key: key,
      path: __path,
      level: level,
      type: expectationType,
      localTypeName: enforceLocalType ?? (__toLocalType as string), // expected also undefined, but safe to cast
      alias: __alias,
      variables: __variables,
    });

    // TODO: add directives
    // resolve queryParams
    if (
      Object.keys(ExpectedType)
        .filter(
          (k) => ![ExpectedType.negligible, ExpectedType.scalar].includes(
            k as ExpectedType,
          ))
        .includes(expectationType)
    ) {
      assert(
        ` '__scalars must be a list of strings'`,
        __scalars === undefined || (Array.isArray(__scalars) && __scalars.every(i => typeof i === 'string'))
      );
      const params = __variables
        ? `(${this.handleVariables(__variables, level)})`
        : '';

      const nestedFields = Object.keys(fields).length > 0 ? Object.entries(fields as Record<string, QueryField>).map(
        ([fieldName, declaration]) => {
          return this.resolveFields(
            fieldName,
            declaration,
            __path,
            level + 1,
            [
              ExpectedType.connection,
              ExpectedType.edges,
              ExpectedType.nodeList,
            ].includes(expectationType)
              ? __toLocalType
              : undefined,
          );
        },
      ).join(' ') : '';

      const variables = this.getOperationVairablesFor(level)

      // leave indentations as is
      return `${this.resolveFieldNaming(key, __alias)} ${params} ${this.composeDirectives(__directives ?? [], variables)} { ${__scalars ? __scalars.join(' ') : ''} ${nestedFields} }`;
    } else {
      return ' ' + this.resolveFieldNaming(key, __alias);
    };
  };

  /** Internal method that saves the expectation for later usage */
  registerExpectation = (expectation: Expectation) => {
    const key = `${expectation.responseKey}:${expectation.level}`;
    this.expectations.set(key, expectation);
  };

  /** Given key on response object and nesting level, returns the appropriate expectation object */
  public getExpectation = (responseKey: string, level: number) => {
    return this.expectations.get(`${responseKey}:${level}`);
  };

  /** Returns a unique for composer variable suffix */
  private getNextVariableIndex = (level: number): `${Level}_${VariableIndex}` => {
    const index = (this.lastVariableIndex += 1);
    return `${level}_${index}`;
  };

  /** Returns aliased or unaliased field piece for GraphQl source */
  private resolveFieldNaming = (key: string, alias?: string) => {
    return alias ? `${alias}: ${key}` : key;
  };

  /**
   * Registers an object mapping of declared and generated final naming and values;
   * @returns a piece of string representing params mapped to operation variables for a field
   */
  public handleVariables = (
    params: Record<string, ReturnType<typeof withScalar> | unknown>,
    level: number,
  ) => {
    const rootParams: string[] = [];
    Object.entries(params).forEach(([key, configuratorOrValue]) => {
      const variableKey = this.getNextVariableIndex(level)
      const variableName = `${key}${variableKey}`;
      if (typeof configuratorOrValue === 'function') {
        assert(
          `'__queryParams' must be declared using plain values or 'withScalar' function`,
          (configuratorOrValue as ReturnType<typeof withScalar>).isComposer,
        );
        const config = configuratorOrValue(
          key,
          variableName,
          level,
        ) as ReturnType<ReturnType<typeof withScalar>>;
        rootParams.push(`${config.queryParamName}: $${config.variableName}`);
        this.operationVariables.set(variableKey, config);
      } else {
        // allow for untyped variable definition via plain values, i.e. without variables
        const finalValue = typeof configuratorOrValue === 'string' ? `"${configuratorOrValue}"` : configuratorOrValue
        rootParams.push(`${key}: ${finalValue}`);
      }
    });
    return rootParams.join(', ');
  };

  /** Returns an object of variables and inputs to be submitted in graphql request */
  public getOperationVairablesFor = (level: number) => {
    return new Map(
      [...this.operationVariables.entries()].filter(
        ([key, item]) => key.split('_')[0]! === String(level),
      ),
    );
  };

  /** Composes directives piece */
  public composeDirectives = (
    directives: Directive[],
    variablesOfLevel?: Composer['operationVariables'],
  ) => {
    const directivesList: string[] = [];
    directives.forEach((directive) => {
      directivesList.push(
        `@${directive.name}(${directive.args && Object.keys(directive.args).length > 0
          ? Object.entries(directive.args)
            .map(([key, arg]) => {
              const __fromVariable = arg as ReturnType<typeof fromVariable>;
              if (typeof __fromVariable === 'function' && __fromVariable.isComposer && __fromVariable.isComposer === true) {
                assert(`No variables specified for composing the directive '${key}'`, variablesOfLevel && variablesOfLevel instanceof Map);
                return `${key}: $${__fromVariable(variablesOfLevel).variableName}`;
              }
              return `${key}: $${arg}`;
            })
            .join(', ')
          : ''
        })`,
      );
    });
    return directivesList.join(' ');
  };

  /** Returns a piece of operation variables */
  public composeOperationVariables = () => {
    let pieces: string[] = [];
    if (this.operationVariables.size > 0) {
      [...this.operationVariables.values()].forEach(item => {
        pieces.push(`$${item.variableName}: ${item.scalarType}`);
      });
    };
    return pieces.length > 0 ? `(${pieces.join(', ')})` : '';
  };

  /** Returns the finalized operation variables for the request  */
  public getRequestVariables = () => {
    const output = {};
    this.operationVariables.forEach((item) => {
      Object.assign(output, {
        [item.variableName]: item.value
      })
    });
    return output;
  };

  /** Returns all collected expectations */
  public getExpectations = () => {
    return this.expectations;
  };

}

export { Composer };
