import { assert } from './assert';
import type { Composer } from './composer';
import type { Fragment } from './types';

/**
 * A function for generating a fragment GraphQL source documents
 */
function fragment<T extends string>(fragment: Fragment<T>){
  const { __fragmentName, __typename, ...fields } =
    fragment;
  assert(`Fragments must have string names defined via '__fragmentName'`, __fragmentName && typeof __fragmentName === 'string');
  assert(`Fragments must have string types defined via '__typename'`, __typename && typeof __typename === 'string');

  const __handler = (composer: Composer) => {
    composer.registerFragment(fragment);
  };

  __handler.isComposer = true;
  __handler.fragmentName = __fragmentName;
  __handler.isFragment = true;
  return __handler;
};

export { fragment };
