import type { OperationBuilder } from '..';
import { Composer } from './composer';

/**
 * Main function for generating a GraphQL source document.
 * Accepts `query`, `mutation` or `subscription` function instances and produces an object with
 * graphql request object and a funtion to retrive the expectations if needed
 *
 * */
const compose = (
  composable: ReturnType<OperationBuilder>,
) => {
  const composer = new Composer(composable.operationName);
  const requestable = {
    operationName: composable.operationName,
    query: composable(composer),
    variables: composer.getRequestVariables(),
  };

  return {
    document: JSON.stringify(requestable),
    getExpectation: composer.getExpectation.bind(composer),
  };
};

export { compose };
