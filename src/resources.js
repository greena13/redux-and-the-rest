import ActionsFactory from './actions/Actions';

import buildReducers from './reducers/buildReducers';
import buildActionCreators from './action-creators/buildActionCreators';
import objectFrom from './utils/object/objectFrom';
import getItem from './utils/getItem';
import getNewItem from './utils/getNewItem';
import getCollection from './utils/getCollection';

function resources(resourceOptions, actionOptions = {}) {
  const { name } = resourceOptions;

  const _actionOptions = objectFrom(actionOptions, {});

  const actions = new ActionsFactory(name, Object.keys(_actionOptions));

  const reducers = buildReducers(resourceOptions, actions, _actionOptions);
  const actionCreators = buildActionCreators(resourceOptions, actions, _actionOptions);

  return {
    actions: actions.toHash(),
    reducers,
    getItem: (resource, params) => getItem(resourceOptions, resource, params),
    getNewItem,
    getCollection: (resource, params) => getCollection(resourceOptions, resource, params),
    ...actionCreators
  };
}


export default resources;
