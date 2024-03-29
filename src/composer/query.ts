import type { Composer } from './composer';
import type { Directive, QueryOperation } from './types';

/**
 * A function for generating a query operation GraphQL source documents
 * e.g.
 * ```ts
 * import { compose, query, withScalar, fromVariable } from '@graphaella';
 *
 * compose(query({
 *   node: {
 *     age: {
 *       __alias: 'yearsLived'
 *     },
 *     friends: {
 *       __toLocalType: 'user',
 *       __alias: 'pals',
 *       __queryParams: {
 *         name__icontains: "John",
 *         includeFriends: withScalar(true, 'Boolean', false)
 *       },
 *       __connection: true,
 *       __scalars: ['id', '__typename'],
 *       __directives: [
 *         {
 *           name: 'include',
 *           args: {
 *             if: fromVariable('includeFriends')
 *           }
 *         }
 *       ]
 *     },
 *     __scalars: ['id', '__typename'],
 *     __queryParams: {
 *       id: withScalar(1, 'ID', true),
 *     },
 *     __alias: "userNode",
 *     __toLocalType: 'user',
 *   },
 *   __operationName: 'UserQuery'
 * }));
 * ```
 */
const query = (operation: QueryOperation) => {
  const { __directives, __variables, __operationName, ...query } =
    operation;
  
  const __query = (composer: Composer) => {

    let tree = '';

    // compose variables first to register them for access inside the tree
    const operationVariables = composer.composeVariables(__variables);

    Object.entries(query).forEach(([key, field]) => {
      tree += ' ' + composer.resolveFields(key, field, [], 1);
    });

    // IMPORTANT! must be called after resolveFields with all the tree to ensure all variables are recorded!
    return `query ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives as Directive[] | undefined)} { ${tree} }`;
  };

  __query.isComposer = true;
  __query.operationName = __operationName ?? 'Query';
  return __query;
};

export { query };
