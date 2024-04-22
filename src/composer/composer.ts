import { assert } from './assert';
import type { fromVariable } from './from-variable';
import {
  type Directive,
  type Expectation,
  type QueryField,
  ExpectedType,
  type FieldName,
  type Fragment,
} from './types';
import { variable } from './variable';


type VariableName = string;

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
  private declare readonly expectations: Map<`${Expectation['responseKey']}:${Expectation['level']}`, Expectation>;

  public declare readonly operationName: string;

  private declare lastVariableIndex: number;

  private declare readonly fragments: Map<Fragment<string>['__fragmentName'], Fragment<string>>;

  private declare fragmentsToInclude: Map<Fragment<string>['__fragmentName'], string>;

  private declare readonly operationVariables: Map<
    VariableName,
    ReturnType<ReturnType<typeof variable>>
  >;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.expectations = new Map();
    this.operationVariables = new Map();
    this.fragments = new Map();
    this.fragmentsToInclude = new Map();
    this.lastVariableIndex = 0;
  }

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
    registerExpectations: boolean = true,
  ): string => {
    const {
      __alias,
      __connection,
      __directives,
      __edges, // ??
      __list,
      __node,
      __args,
      __toLocalType,
      __scalars,
      __fragments,
      ...fields
    } = field as {
      __alias?: string;
      __connection?: boolean;
      __directives?: Directive[];
      __edges?: boolean;
      __list?: boolean;
      __node?: boolean;
      __args?: Record<string, unknown | ReturnType<typeof fromVariable>>;
      __toLocalType?: string;
      __fragments?: Fragment<string>['__fragmentName'][]
      __scalars?: FieldName[];
    } & { [key: string]: QueryField }; // ok for dasherized fields to be undefined
    assert(
      `Fields must be declared via objects or using '__scalars'`,
      typeof fields === 'object' && !Array.isArray(fields),
    );
    assert(
      `No fields are declared at '${path.join('.')}'.`,
      fields || __scalars
    );

    const expectation = this.registerExpectation(key, field, path, level, enforceLocalType);

    if (
      Object.keys(ExpectedType)
        .filter(
          (k) =>
            ![ExpectedType.negligible, ExpectedType.scalar].includes(
              k as ExpectedType,
            ),
        )
        .includes(expectation.type)
    ) {
      assert(
        `'__scalars must be an array of strings'`,
        __scalars === undefined ||
        (Array.isArray(__scalars) &&
          __scalars.every((i) => typeof i === 'string')),
      );
      assert(
        `'__fragments' must be an array of fragment names`,
        __fragments === undefined ||
        (Array.isArray(__fragments) &&
          __fragments.every((i) => typeof i === 'string'))
      );

      const fragmentSpreads = __fragments?.map(name => this.composeFragmentSpread(name, path, level, enforceLocalType)).join(' ') ?? '';

      const params = this.composeParams(__args);

      const listTypes = new Set([
        ExpectedType.connection,
        ExpectedType.edges,
        ExpectedType.nodeList]);

      const nestedFields =
        Object.keys(fields).length > 0
          ? Object.entries(fields as Record<string, QueryField>)
            .map(([fieldName, declaration]) => {
              return this.resolveFields(
                fieldName,
                declaration,
                expectation.path,
                level + 1,
                listTypes.has(expectation.type)
                  ? __toLocalType
                  : undefined,
              );
            })
            .join(' ')
          : '';

      // leave indentations as is
      return ` ${this.resolveFieldNaming(key, __alias)} ${params} ${this.composeDirectives(__directives)} { ${__scalars ? __scalars.join(' ') : ''} ${fragmentSpreads} ${nestedFields} }`;
    } else {
      return ' ' + this.resolveFieldNaming(key, __alias);
    }
  };


  /** Internal method that saves the expectation for later usage */
  private registerExpectation = (
    key: string,
    field: QueryField,
    path: string[],
    level: number,
    enforceLocalType?: string,
  ) => {
    const {
      __alias,
      __connection,
      __directives,
      __edges, // ??
      __list,
      __node,
      __args,
      __toLocalType,
      __scalars,
      ...fields
    } = field as {
      __alias?: string;
      __connection?: boolean;
      __directives?: Directive[];
      __edges?: boolean;
      __list?: boolean;
      __node?: boolean;
      __args?: Record<string, unknown | ReturnType<typeof fromVariable>>;
      __toLocalType?: string;
      __scalars?: FieldName[];
    } & { [key: string]: QueryField }; // ok for dasherized fields to be undefined

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
        (Object.keys(fields).length > 0 ||
          __args !== undefined ||
          __scalars !== undefined):
        expectationType = ExpectedType.record;
        break;
      // scalar field of node
      case (__toLocalType === undefined &&
        Object.keys(fields).length === 0 &&
        __args === undefined &&
        __scalars === undefined):
        expectationType = ExpectedType.scalar;
        break;
      // scalar field of object without localTypeName
      default:
        expectationType = ExpectedType.negligible;
        break;
    };

    const expectation = {
      responseKey: responseKey,
      key: key,
      path: __path,
      level: level,
      type: expectationType,
      localTypeName: enforceLocalType ?? (__toLocalType as string), // expected also undefined, but safe to cast
      alias: __alias,
      params: __args as Record<string, unknown | ReturnType<typeof fromVariable>>,
    };

    const expectationKey = `${expectation.responseKey}:${expectation.level}` as `${Expectation['responseKey']}:${Expectation['level']}`;
    this.expectations.set(expectationKey, expectation);
    return this.expectations.get(expectationKey)!
  };

  /** Given key on response object and nesting level, returns the appropriate expectation object */
  public getExpectation = (responseKey: string, level: number) => {
    return this.expectations.get(`${responseKey}:${level}`);
  };


  /** Returns aliased or unaliased field piece for GraphQl source */
  private resolveFieldNaming = (key: string, alias?: string) => {
    return alias ? `${alias}: ${key}` : key;
  };



  private composeParams = (
    params?: Record<string, unknown | ReturnType<typeof fromVariable>>,
  ) => {
    const __args = params ?? {};
    const fieldParams: string[] = [];
    Object.entries(__args).forEach(([paramName, fromVariableFunctionOrValue]) => {
      if (typeof fromVariableFunctionOrValue === 'function') {
        assert(
          `'__args' must be declared using plain values or 'fromVariable' function`,
          (fromVariableFunctionOrValue as ReturnType<typeof fromVariable>).isComposer,
        );
        const config = fromVariableFunctionOrValue(this.operationVariables) as ReturnType<ReturnType<typeof variable>>;
        fieldParams.push(`${paramName}: $${config.variableName}`);
      } else {
        // allow for untyped variable definition via plain values, i.e. without variables
        const finalValue =
          typeof fromVariableFunctionOrValue === 'string'
            ? `"${fromVariableFunctionOrValue}"`
            : fromVariableFunctionOrValue;
        fieldParams.push(`${paramName}: ${finalValue}`);
      };
    });
    return params ? `(${fieldParams.join(', ')})` : '';
  }




  /**
   * Registers an object mapping of declared and generated final naming and values;
   * @returns a piece of string representing operation variables
   */
  public variables = (
    variables?: Record<string, ReturnType<typeof variable>>,
  ) => {
    assert(
      `'__variables' must be declared using 'variable' function'`,
      variables === undefined || (typeof variables === 'object' && !Array.isArray(variables) && Object.values(variables).every((handler) => {
        return typeof handler === 'function' && (handler as ReturnType<typeof variable>).isComposer
      }))
    );
    const __variables = variables ?? {};
    const operationParams: string[] = [];
    Object.entries(__variables).forEach(([variableName, variableHandler]) => {
      const config = variableHandler(
        variableName,
      ) as ReturnType<ReturnType<typeof variable>>;
      operationParams.push(`$${config.variableName}: ${config.scalarType}`);
      if (!this.operationVariables.has(variableName)) {
        this.operationVariables.set(variableName, config);
      };
    });
    return variables ? `(${operationParams.join(', ')})` : '';
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
    directives?: Directive[],
  ) => {
    const __directives = directives ?? [];
    assert(`Directives must be an array of Directive objects`, Array.isArray(__directives) && __directives.every(
      directive => typeof directive === 'object' && !Array.isArray(directive) && directive.name))
    const directivesList: string[] = [];
    __directives.forEach((directive) => {
      const { name, args } = directive;
      directivesList.push(
        `@${name}(${args && Object.keys(args).length > 0
          ? Object.entries(args)
            .map(([key, arg]) => {
              const __fromVariable = arg as ReturnType<typeof fromVariable>;
              if (
                typeof __fromVariable === 'function' &&
                __fromVariable.isComposer === true
              ) {
                return `${key}: $${__fromVariable(this.operationVariables).variableName}`;
              }
              return `${key}: ${typeof arg === 'string' ? `"${arg}"` : arg}`;
            })
            .join(', ')
          : ''
        })`,
      );
    });
    return directivesList.join(' ');
  };

  /** Returns the finalized operation variables for the request  */
  public getRequestVariables = () => {
    const output = {};
    this.operationVariables.forEach((item) => {
      Object.assign(output, {
        [item.variableName]: item.value,
      });
    });
    return output;
  };

  /** Returns all collected expectations */
  public getExpectations = () => {
    return this.expectations;
  };

  /** Registers single fragment with the composer instance */
  public registerFragment = <T extends string>(fragment: Fragment<T>) => {
    assert(`Duplicate fragment names are not allowed`, !this.fragments.has(fragment.__fragmentName));
    this.fragments.set(fragment.__fragmentName, fragment);
  };

  /** Returns a spread of block fragment, while composing a fragment and adding to fragments to be included in the final document */
  private composeFragmentSpread = (
    fragmentName: Fragment<string>['__typename'],
    path: string[],
    level: number,
    enforceLocalType?: string,
  ): string => {
    assert(`No fragment named ${fragmentName} was found.`, this.fragments.has(fragmentName));
    const { __typename, __fragmentName, __scalars, __fragments, ...fields } = this.fragments.get(fragmentName)!;
    // handle fields with expectation registration
    let tree = '';
    tree += __scalars ? __scalars.join(' ') : '';
    // allow nesting fragments
    assert(
      `'__fragments' must be an array of fragment names`,
      __fragments === undefined ||
      (Array.isArray(__fragments) &&
        __fragments.every((i) => typeof i === 'string'))
    );
    if (__fragments){
      assert(`'${fragmentName}' fragment spreads itself on the same level`, !__fragments.includes(fragmentName));
    };
    tree += __fragments ? __fragments.map(name => this.composeFragmentSpread(name, path, level, enforceLocalType)).join(' ') : '';
    Object.entries(fields).forEach(([key, field]) => {
      tree += this.resolveFields(key, field, path, level + 1, enforceLocalType);
    });
    // create and include a fragment declaration once for source query inclusion
    if (!this.fragmentsToInclude.has(__fragmentName)) {
      this.fragmentsToInclude.set(__fragmentName, `fragment ${__fragmentName} on ${__typename} { ${tree} }`)
    };
    return `...${fragmentName}`;
  };

  public composeIncludedFragments = () => {
    return [...this.fragmentsToInclude.values()].join(' ');
  }
}

export { Composer };
