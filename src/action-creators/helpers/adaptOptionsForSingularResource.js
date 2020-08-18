import processActionCreatorOptions from './processActionCreatorOptions';

function adaptOptionsForSingularResource(singular, args) {
  if (singular) {
    return processActionCreatorOptions(
      args[0],
      args[1],
      args[2]
    );
  } else {
    return {
      params: args[0],
      values: args[1],
      actionCreatorOptions: args[2] || {}
    };
  }
}

export default adaptOptionsForSingularResource;
