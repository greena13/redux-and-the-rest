import buildStore from '../../helpers/buildStore';
import { EDITING, SUCCESS } from '../../../constants/Statuses';
import { resources } from '../../../index';
import {
  expectToNotChangeResourcesItemStatus,
  expectToNotChangeResourcesItemValues,
  expectToClearResourcesItemStatus,
  resourcesDefinition,
  expectToChangeResourcesItemStatusTo
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Clear editItem reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearItemEdit: clearUserEdit } } = resources({
      name: RESOURCE_NAME,
    }, {
      clearItemEdit: true
    });

    this.clearUserEdit = clearUserEdit;
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
              type: EDITING,
              syncedAt: 2,
              requestedAt: 1,
              dirty: 1,
              originalValues: {
                id: 1,
                username: 'Jillian',
              }
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

  describe('Given the user attempts to clear a resource item that is NOT being edited', function () {
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

    it('then does NOT change the status', function() {
      expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, 1);
    });

    it('then does NOT change the values', function() {
      expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, 1);
    });
  });

  describe('Given the user attempts to clear a resource item that is being edited', function () {
    beforeAll(function () {
      this.initialState = {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Jill',
            },
            status: {
              type: EDITING,
              syncedAt: 2,
              requestedAt: 1,
              dirty: 1,
              originalValues: {
                id: 1,
                username: 'Jillian',
              }
            },
          }
        },
        selectionMap: { },
        newItemKey: null
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState, 1);
    });

    expectToResetResourceItem();
  });

  describe('Given an update has failed to apply for a resource item', () => {
    beforeAll(function () {
      this.initialState = {
        items: {
          1: {
            values: {
              username: 'Robert',
              id: 1
            },
            status: {
              dirty: true,
              originalValues: {
                username: 'Bobert',
                id: 1
              },
              type: 'ERROR',
              requestedAt: 2,
              syncedAt: 1,
              httpCode: 404,
              error: {
                message: 'Not Found',
              }
            },
            metadata: {
              type: 'COMPLETE'
            }
          }
        },
        collections: {},
        selectionMap: {},
        newItemKey: null
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState, 1);
    });

    expectToResetResourceItem();

    it('then clears the error details', function() {
      expectToClearResourcesItemStatus(this, RESOURCE_NAME, 1, 'error');
      expectToClearResourcesItemStatus(this, RESOURCE_NAME, 1, 'httpCode');
    });
  });

  function expectToResetResourceItem() {
    it('then changes the status type to SUCCESS', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, 1, 'type', SUCCESS);
    });

    it('then does NOT change the syncedAt value in the status', function () {
      expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, 1, 'syncedAt');
    });

    it('then does NOT change the requestedAt value in the status', function () {
      expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, 1, 'requestedAt');
    });

    it('then clears the original values', function () {
      expectToClearResourcesItemStatus(this, RESOURCE_NAME, 1, 'originalValues');
    });

    it('then clears the dirty bit', function () {
      expectToClearResourcesItemStatus(this, RESOURCE_NAME, 1, 'dirty');
    });

    it('then changes the values back to originalValues', function () {
      expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, 1, this.initialState.items[1].status.originalValues);
    });
  }

  function setupInitialState(context, resourcesName, initialState, userId) {
    context.store = buildStore({
      [resourcesName]: {
        ...initialState,
        newItemKey: null
      }
    }, { [resourcesName]: context.reducers } );

    context.store.dispatch(context.clearUserEdit(userId));
  }
});
