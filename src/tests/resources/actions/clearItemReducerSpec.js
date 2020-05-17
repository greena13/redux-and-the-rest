import buildStore from '../../helpers/buildStore';
import { SUCCESS } from '../../../constants/Statuses';
import { resources } from '../../../index';
import {
  resourcesDefinition,
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Clear item reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearItem: clearUser } } = resources({
      name: RESOURCE_NAME,
    }, {
      clearItem: true
    });

    this.clearUser = clearUser;
    this.reducers = reducers;
  });

  describe('Given the user attempts to clear a resource item that isn\'t in the store', function () {
    beforeAll(function () {
      this.initialState = {
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
        selectionMap: { },
        newItemKey: null
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState, 100);
    });

    it('then DOES nothing', function() {
      expect(resourcesDefinition(this, RESOURCE_NAME)).toEqual(this.initialState);
    });
  });

  describe('Given the user attempts to clear a resource item in the store', function () {
    beforeAll(function () {
      this.initialState = {
        items: {
          1: {
            values: {
              id: 2,
              username: 'Bob',
            },
            status: { type: SUCCESS, syncedAt: 2, requestedAt: 1 },
          },
        },
        selectionMap: { },
        newItemKey: null
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState, 1);
    });

    it('then clears the item', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).items[1]).toEqual(undefined);
    });
  });

  function setupInitialState(context, resourcesName, initialState, userId) {
    context.store = buildStore({
      [resourcesName]: {
        ...initialState,
        newItemKey: null
      }
    }, { [resourcesName]: context.reducers } );

    context.store.dispatch(context.clearUser(userId));
  }
});
