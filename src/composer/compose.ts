import type { ConfiguredOperationHandler, OperationBuilder } from '..';
import { Composer } from './composer';
import { fragment } from './fragment';

/**
 * Main function for generating a GraphQL source documents. supports batching if multiple operations are passed
 * Accepts `operation` and `fragment` function instances and produces an object with
 * graphql request object and a method to retrive the expectations if needed
 * */
const compose = (
  ...composables: (ReturnType<OperationBuilder> | ReturnType<typeof fragment>)[]
) => {
  const operations: ReturnType<OperationBuilder>[] = [];
  const fragments: ReturnType<typeof fragment>[] = [];
  composables.forEach(handler => {
    if (handler?.isFragment){
      fragments.push(handler);
    } else {
      operations.push(handler as ConfiguredOperationHandler);
    }
  });
  const requestables: {
    document: Record<string, unknown>,
    composer: Composer,
}[] = [];
  operations.forEach(op => {
    const composer = new Composer(op.operationName);
    fragments.forEach(fr => fr(composer));
    const doc = {
      operationName: composer.operationName,
      query: op(composer).replace(/\s+/g, ' ').trim(),
      variables: JSON.stringify(composer.getRequestVariables()),
    };
    requestables.push({
      document: doc,
      composer: composer
    });
  });

  return requestables;

};

export { compose };
