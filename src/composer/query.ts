import type { Composer } from './composer';
import type { QueryOperation } from './types';

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
  const { __directives, __directiveParams, __operationName, ...query } = operation;
  const level = 0;

  const __query = (composer: Composer) => {
    if (__directiveParams && Object.keys(__directiveParams).length > 0){
      composer.handleVariables(__directiveParams, level);
    }

    let tree = '';
    Object.entries(query).forEach(([fieldName, fieldValue]) => {
      tree += composer.resolveFields(
        fieldName,
        fieldValue,
        [],
        level + 1,
      );
    });

    const operationVariables =
    composer.composeOperationVariables();

    const variablesSet = composer.getOperationVairablesFor(0);

    // IMPORTANT! must be called after resolveFields with all the tree to ensure all variables are recorded!
    return `query ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives ?? [], variablesSet ?? new Set())} { ${tree} }`;
  };

  __query.isComposer = true;
  __query.operationName = __operationName ?? 'Query';
  return __query;
};

export { query };
