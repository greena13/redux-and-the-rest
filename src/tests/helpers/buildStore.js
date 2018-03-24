import { createStore, applyMiddleware, compose, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

function buildStore(initialState, reducers) {
  return createStore(combineReducers(reducers), initialState, compose(applyMiddleware(Thunk)));
}

export default buildStore;
