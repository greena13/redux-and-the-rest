import buildStore from '../../helpers/buildStore';
import { SUCCESS } from '../../../constants/Statuses';
import { RESOURCES, resources } from '../../../index';
import {
  resourcesDefinition,
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Clear list reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearList: clearUsers } } = resources({
      name: RESOURCE_NAME,
    }, {
      clearList: true
    });

    this.clearUsers = clearUsers;
    this.reducers = reducers;

    this.initialState = {
      ...RESOURCES,
      items: {
        1: {
          values: {
            id: 1,
            username: 'Jill',
          },
          status: {
            type: SUCCESS,
            syncedAt: 2,
            requestedAt: 1,
          },
        }
      },
      lists: {
        [EmptyKey]: {
          positions: [ 1 ],
          status: { type: SUCCESS }
        }
      },
    };
  });

  describe('Given the user attempts to clear a resource list that isn\'t in the store', function () {
    beforeAll(function () {
      setupInitialState(this, RESOURCE_NAME, this.initialState, 100);
    });

    it('then DOES nothing', function() {
      expect(resourcesDefinition(this, RESOURCE_NAME)).toEqual(this.initialState);
    });
  });

  describe('Given the user attempts to clear a resource list in the store', function () {
    beforeAll(function () {
      setupInitialState(this, RESOURCE_NAME, this.initialState, EmptyKey);
    });

    it('then clears the list', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).lists[EmptyKey]).toEqual(undefined);
    });
  });

  function setupInitialState(context, resourcesName, initialState, listId) {
    context.store = buildStore({
      [resourcesName]: {
        ...initialState,
        newItemKey: null
      }
    }, { [resourcesName]: context.reducers } );

    context.store.dispatch(context.clearUsers(listId));
  }
});
