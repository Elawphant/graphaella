import { assert } from './assert';

function variable(
  value: unknown,
  customScalar: string,
  nonNullable: boolean,
) {
  const __configurationHandler = (
    variableName: string,
  ) => {
    assert(
      `The 'variableName' must not include '!', use 'nonNullable' argument to mark it as non nullable`,
      !customScalar ||
        (customScalar &&
          typeof customScalar === 'string' &&
          !customScalar.includes('!')),
    );
    const nonNull = nonNullable ? '!' : '';
    return {
      variableName: variableName,
      scalarType:`${customScalar}${nonNull}`,
      value: value,
    };
  };

  __configurationHandler.isComposer = true;

  return __configurationHandler;
};

export { variable };
