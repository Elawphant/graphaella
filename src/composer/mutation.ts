import type { Composer } from './composer';
import type { MutationOperation } from './types';

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
  const { __operationName, __directives, __directiveParams, ...mutation } = operation;

  const __mutation = (composer: Composer) => {
    const level = 0;
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
    return `mutation ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives ?? [], variablesSet ?? new Set())} { ${tree} }`;
  };

  __mutation.isComposer = true;
  __mutation.operationName = __operationName ?? 'Mutation';

  return __mutation;
};

export { mutation };
