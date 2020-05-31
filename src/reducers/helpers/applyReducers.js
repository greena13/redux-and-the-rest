function applyReducers(reducersDictionary, resource, action = {}) {
  const { type } = action;

  const actionReducer = reducersDictionary[type];

  if (actionReducer) {
    return actionReducer.reducer(resource, action);
  } else {
    return resource;
  }
}

export default applyReducers;
