import EmptyKey from '../../constants/EmptyKey';
import isUndefined from '../../utils/isUndefined';

function adaptOptionsForSingularResource({ paramsOptional, acceptsValues }, args) {
  const definedArgs = getNumberOfArguments(args);

  if (acceptsValues) {
    if (paramsOptional) {
      switch (definedArgs) {
        case 1:
          return {
            params: EmptyKey,
            values: args[0],
            actionCreatorOptions: {}
          };
        case 2:
          return {
            params: args[0],
            values: args[1],
            actionCreatorOptions: {}
          };
        default:
          return {
            params: args[0],
            values: args[1],
            actionCreatorOptions: args[2]
          };
      }
    } else {
      switch (definedArgs) {
        case 1:
          return {
            params: args[0],
            values: {},
            actionCreatorOptions: {}
          };
        case 2:
          return {
            params: args[0],
            values: args[1],
            actionCreatorOptions: {}
          };
        default:
          return {
            params: args[0],
            values: args[1],
            actionCreatorOptions: args[2]
          };
      }
    }
  } else {
    switch (definedArgs) {
      case 1:
        return {
          params: args[0],
          actionCreatorOptions: {}
        };
      case 2:
        return {
          params: args[0],
          actionCreatorOptions: args[1] || {}
        };
      default:
        return {
          params: args[0],
          actionCreatorOptions: args[2] || {}
        };
    }
  }
}

function getNumberOfArguments(args) {
  const argsInReverse = args.slice().reverse();

  for (let index = 0; index < argsInReverse.length; index++) {
    const element = argsInReverse[index];

    if (!isUndefined(element)) {
      return args.length - index;
    }
  }

  return args.length;
}

export default adaptOptionsForSingularResource;
