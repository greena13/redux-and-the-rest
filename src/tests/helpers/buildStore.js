import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

function buildStore(initialState, reducers) {
  return createStore(combineReducers(reducers), initialState, applyMiddleware(Thunk));
}

export default buildStore;
