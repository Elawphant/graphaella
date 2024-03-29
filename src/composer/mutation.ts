import type { Composer } from './composer';
import type { Directive, MutationOperation } from './types';

/**
 * A function for generating a mutation operation GraphQl source documents
 * e.g.
 * ```ts
 * import { compose, mutation, withScalar } from '@graphaella';
 *
 * compose(mutation({
 *  storyLike: {
 *    story: {
 *      likers: {
 *        __scalars: ['count']
 *      },
 *      likeSentence: {
 *        __scalars: ['text']
 *      }
 *    },
 *    __variables: {
 *      input: withScalar({
 *          addLike: true
 *        }, 'LikePostInput', true)
 *    }
 *  },
 * }))
 * ```
 *
 * will produce
 *
 * ```
 * mutation StoryLikeMutation($input: StoryLikeInput) {
 * storyLike(input: $input) {
 *   story {
 *     likers { count }
 *     likeSentence { text }
 *   }
 *  }
 * }```
 * */
const mutation = (operation: MutationOperation) => {
  const { __operationName, __directives, __variables, ...mutation } =
    operation;

  const __mutation = (composer: Composer) => {
    const level = 0;
    let tree = '';
    // IMPORTANT! must be called before resolveFields to ensure all variables are recorded before tree!
    const operationVariables = composer.composeVariables(__variables);

    Object.entries(mutation).forEach(([fieldName, fieldValue]) => {
      tree += ' ' + composer.resolveFields(fieldName, fieldValue, [], level + 1);
    });

    return `mutation ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives as Directive[] | undefined)} { ${tree} }`;
  };

  __mutation.isComposer = true;
  __mutation.operationName = __operationName ?? 'Mutation';

  return __mutation;
};

export { mutation };
