import type { OperationType, Directive, MutationOperation, QueryOperation, SubscriptionOperation, ConfiguredOperationHandler, OperationHandler } from "..";
import { assert } from "./assert";
import type { Composer } from "./composer";


/**
 * Internal function that builds tree and operationVariables
 */
function handleOperation(
  operationType: OperationType,
  operation: QueryOperation | MutationOperation | SubscriptionOperation,
  composer: Composer, 
) {

  const { __directives, __variables, __operationName, ...fields } = operation as (QueryOperation | MutationOperation | SubscriptionOperation);
  const level = 0;

  if (operationType !== 'query'){
    assert(`A ${operationType} operation must have a single field `, Object.keys(fields).length === 1);
  };

  let tree = '';

  // compose variables first to register them for access inside the tree and directives
  const operationVariables = composer.variables(__variables);

  Object.entries(fields).forEach(([key, field]) => {
    tree += ' ' + composer.resolveFields(key, field, [], level + 1);
  });

  const op = `${operationType} ${composer.operationName} ${operationVariables} ${composer.composeDirectives(__directives as Directive[] | undefined)} { ${tree} }`;

  return `${composer.composeIncludedFragments()} ${op}`
};


const configureHandler = (
  handler: OperationHandler, 
  name: string
): ConfiguredOperationHandler => {
  Object.assign(handler, {
    isComposer: true,
    operationName: name,
  });
  // ts gets confused with Object.asign
  return handler as unknown as ConfiguredOperationHandler;
}

export { handleOperation, configureHandler };