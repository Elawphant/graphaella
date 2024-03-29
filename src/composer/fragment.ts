import type { Composer } from './composer';
import type { QueryOperation } from './types';

/**
 * A function for generating a fragment GraphQL source documents
 * e.g.
 * ```ts
 * import { fragment } from '@graphaella';
 *
 * compose(fragment{
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
const fragment = (operation: QueryOperation) => {
  const { __variables, __fragmentName, ...query } =
    operation;
  const level = 0;

  const __fragment = (composer: Composer) => {

    let tree = '';

    // compose variables first to register them for access inside the tree
    const operationVariables = composer.composeVariables(__variables);

    // TODO: Fragments should be parsed to expectations differently
    // Object.entries(query).forEach(([key, field]) => {
    //   tree += ' ' + composer.resolveFields(key, field, [], level + 1);
    // });
    return `fragment ${composer.operationName} ${operationVariables}} { ${tree} }`;
  };

  __fragment.isComposer = true;
  __fragment.fragmentName = __fragmentName ?? 'Fragment';
  return __fragment;
};

export { fragment };
