import { assert } from './assert';

const withScalar = (
  value: unknown,
  customScalar: string | Object,
  nonNullable: boolean,
) => {
  const __configurationHandler = (
    queryParamName: string,
    variableName: string,
    level: number,
  ) => {
    assert(
      `The 'variableName' must not include '!', use 'nonNullable' argument to mark it as non nullable`, 
      !customScalar || 
      customScalar && typeof customScalar === 'string' && !customScalar.includes('!') || 
      customScalar && typeof customScalar === 'object' && !customScalar.constructor.name.includes('!') 
    );
    const nonNull = nonNullable ? '!' : '';
    return {
      queryParamName: queryParamName, 
      variableName: variableName,
      scalarType:
        typeof customScalar === 'string'
          ? `${customScalar}${nonNull}`
          : `${customScalar.constructor.name}${nonNull}`,
      value: value,
      level: level,
    };
  };

  __configurationHandler.isComposer = true;

  return __configurationHandler;
};

export { withScalar };
