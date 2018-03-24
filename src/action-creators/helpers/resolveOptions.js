import arrayFrom from '../../utils/array/arrayFrom';
import hasKey from '../../utils/object/hasKey';

function resolveOptions(...options) {
  const attributes = options.pop();

  const prioritisedOptions = options.reverse();

  return arrayFrom(attributes).reduce((memo, attributeName) => {
    const highestPriorityOption = prioritisedOptions.find((args) => hasKey(args, attributeName));

    if (highestPriorityOption) {
      memo[attributeName] = highestPriorityOption[attributeName];
    }

    return memo;
  }, {});
}

export default resolveOptions;
