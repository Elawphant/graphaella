import type { Composer } from './composer';
import type { Directive, SubscriptionOperation } from './types';

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
  const { __operationName, __directives, __variables, ...mutation } =
    operation;

  const __subscription = (composer: Composer) => {
    const level = 0;
    let tree = '';
    // IMPORTANT! must be called before resolveFields to ensure all variables are recorded before tree!
    const operationVariables = composer.composeVariables(__variables);

    Object.entries(mutation).forEach(([fieldName, fieldValue]) => {
      tree += ' ' + composer.resolveFields(fieldName, fieldValue, [], level + 1);
    });
    return `subscription ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives as Directive[] | undefined)} { ${tree} }`;
  };

  __subscription.isComposer = true;
  __subscription.operationName = __operationName ?? 'Subscription';

  return __subscription;
};

export { subscription };
