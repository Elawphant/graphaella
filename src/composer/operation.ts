import type { Composer } from './composer';
import { configureHandler, handleOperation } from './operation-handler';
import type { OperationType, OperationHandler, QueryOperation, OperationBuilder } from './types';

/**
 * A function for generating a query operation GraphQL source documents
 * e.g.
 * ```ts
 * import { compose, query, variable, fromVariable } from '@graphaella';
 *
 * compose(query({
 *   __operationName: 'UserQuery',
 *   __variables: {
 *     shouldIncludeFirends: variable(true, 'Boolean', false),
 *     friendAge: variable(32, 'Number', false),
 *     userId: variable(1, 'ID', true),
 *   },
 *   node: {
 *     age: {
 *       __alias: 'yearsLived'
 *     },
 *     friends: {
 *       __toLocalType: 'user',
 *       __alias: 'pals',
 *       __args: {
 *         name__icontains: "John",
 *         age: fromVariables('friendAge')
 *       },
 *       __connection: true,
 *       __scalars: ['id', '__typename'],
 *       __directives: [
 *         {
 *           name: 'include',
 *           args: {
 *             if: fromVariable('shouldIncludeFriends')
 *           }
 *         }
 *       ]
 *     },
 *     __scalars: ['id', '__typename'],
 *     __args: {
 *       id: fromVariables('userId'),
 *     },
 *     __alias: "userNode",
 *     __toLocalType: 'user',
 *   },
 * }));
 * ```
 */
const operation: OperationBuilder = (type: OperationType, operation: QueryOperation) => {
  const __handler: OperationHandler = (composer: Composer) => {

    return handleOperation(type, operation, composer)
  };

  return configureHandler(__handler, operation?.__operationName ?? '');
};

export { operation };
