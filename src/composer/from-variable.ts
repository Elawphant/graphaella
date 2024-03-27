import { assert } from './assert';
import type { Composer } from './composer';

/** 
 * A function for declaring a reference to typed varible instead of static value when composing 
 * E.g.
 * ```ts
 * __directives: [
 *  {
 *    name: 'include',
 *    args: {
 *      if: fromVariable('includeFriends')
 *    }
 *  }
 * ]
 * ```
 * */
const fromVariable = (variableName: string) => {
  const __fromVariable = (
    variablesForLevel: Composer['operationVariables'],
  ) => {
    const output = [...variablesForLevel.values()].find(
      (variable) => variable.queryParamName === variableName,
    );
    assert(
      `Cannot find variable '${variableName}'`,
      output,
    );
    return output;
  };
  __fromVariable.isComposer = true;
  return __fromVariable;
};

export { fromVariable };
