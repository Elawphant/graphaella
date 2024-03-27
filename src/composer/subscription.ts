import type { Composer } from './composer';
import type { SubscriptionOperation } from './types';

/** 
 * A function for generating a subscription operation GraphQL source documents 
 * e.g. 
 * ```ts
 * import { compose, subscription, withScalar } from '@graphaella';
 * 
 * compose(subscription({
 *   newPost: {
 *     __alias: 'post',
 *     __scalars: ['id', 'title', 'content'],
 *     __variables: {
 *       authorId: withScalar(1, 'ID', true),
 *       input: category: withScalar('technology', 'String', false)
 *     },
 *   },
 *   __operationName: 'NewPostSubscription'
 * }));
 * ```
 */
const subscription = (operation: SubscriptionOperation) => {
  const { __operationName, __directives, __directiveParams, __input, ...mutation } = operation;

  const __subscription = (composer: Composer) => {
    const level = 0;
    if (__input) {
      // only register
      composer.handleVariables(__input, level);
    }
    let tree = '';
    Object.entries(mutation).forEach(([fieldName, fieldValue]) => {
      tree += composer.resolveFields(
        fieldName,
        fieldValue,
        [],
        level + 1,
      );
    });

    const variablesSet = composer.getOperationVairablesFor(0);

    // IMPORTANT! must be called after resolveFields with all the tree to ensure all variables are recorded!
    const operationVariables =
      composer.composeOperationVariables();
    return `subscription ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives ?? [], variablesSet ?? new Set())} { ${tree} }`;
  };

  __subscription.isComposer = true;
  __subscription.operationName = __operationName ?? 'Subscription';

  return __subscription;
};

export { subscription };
