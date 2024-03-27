import { Composer } from "./composer";
import type { mutation } from "./mutation";
import type { query } from "./query";
import type { subscription } from "./subscription";


/** 
 * Main function for generating a GraphQL source document.
 * Accepts `query`, `mutation` or `subscription` function instances and produces an object with 
 * graphql request object and a funtion to retrive the expectations if needed
 *   
 * */
const compose = (composable: ReturnType<typeof query | typeof subscription | typeof mutation>) => {
  const composer = new Composer(composable.operationName);
  const requestable = {
    operationName: composable.operationName,
    query: composable(composer),
    variables: composer.getRequestVariables(),
  };

  return {
    document: requestable,
    getExpectation: composer.getExpectation.bind(composer)
  };
};


export { compose };