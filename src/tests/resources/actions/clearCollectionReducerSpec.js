import buildStore from '../../helpers/buildStore';
import { SUCCESS } from '../../../constants/Statuses';
import { RESOURCES, resources } from '../../../index';
import {
  resourcesDefinition,
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Clear collection reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearCollection: clearUsers } } = resources({
      name: RESOURCE_NAME,
    }, {
      clearCollection: true
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
      collections: {
        [EmptyKey]: {
          positions: [ 1 ],
          status: { type: SUCCESS }
        }
      },
    };
  });

  describe('Given the user attempts to clear a resource collection that isn\'t in the store', function () {
    beforeAll(function () {
      setupInitialState(this, RESOURCE_NAME, this.initialState, 100);
    });

    it('then DOES nothing', function() {
      expect(resourcesDefinition(this, RESOURCE_NAME)).toEqual(this.initialState);
    });
  });

  describe('Given the user attempts to clear a resource collection in the store', function () {
    beforeAll(function () {
      setupInitialState(this, RESOURCE_NAME, this.initialState, EmptyKey);
    });

    it('then clears the collection', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).collections[EmptyKey]).toEqual(undefined);
    });
  });

  function setupInitialState(context, resourcesName, initialState, collectionId) {
    context.store = buildStore({
      [resourcesName]: {
        ...initialState,
        newItemKey: null
      }
    }, { [resourcesName]: context.reducers } );

    context.store.dispatch(context.clearUsers(collectionId));
  }
});
