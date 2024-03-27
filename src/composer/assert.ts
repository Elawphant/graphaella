import { ERROR_MESSAGE_PREFIX } from "./utils";

/** 
 * Throws error with message if test is falsy or undefined  
 * */
function assert(message: string): never;
function assert(message: string, test: unknown): asserts test;
function assert(message: string, test?: unknown): asserts test {
  if (!test) {
    throw new Error(ERROR_MESSAGE_PREFIX + ': ' + message);
  };
};

export { assert };