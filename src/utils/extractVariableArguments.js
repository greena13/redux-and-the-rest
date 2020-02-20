import isUndefined from './isUndefined';

function extractVariableArguments(argumentNames, argumentsList) {
  const offset = function(){
    if (isUndefined(argumentsList[argumentsList.length - 1])) {
      return 1;
    } else {
      return 0;
    }
  }();

  const argumentsMap = {};

  const undefinedArguments = argumentNames.slice(0, offset);

  undefinedArguments.forEach((argumentName) => {
    argumentsMap[argumentName] = undefined;
  });

  return argumentNames.slice(offset).reduce((memo, argumentName, index) => {
    memo[argumentName] = argumentsList[index];

    return memo;
  }, {});
}

export default extractVariableArguments;
