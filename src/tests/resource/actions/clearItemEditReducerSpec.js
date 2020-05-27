import { EDITING, SUCCESS } from '../../../constants/Statuses';
import { resource } from '../../../../index';
import {
  expectToNotChangeResourceItemStatus,
  expectToNotChangeResourceItemValues,
  expectToChangeResourceItemStatusTo,
  expectToClearResourceItemStatus,
  expectToChangeResourceItemValuesTo,
  setupInitialState,
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';
import { RESOURCES } from '../../..';

const RESOURCE_NAME = 'users';

describe('Clear editItem reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearItemEdit: clearUserEdit } } = resource({
      name: RESOURCE_NAME,
    }, {
      clearItemEdit: true
    });

    this.clearUserEdit = clearUserEdit;
    this.reducers = reducers;
  });

  describe('Given the user attempts to clear the resource item when it is NOT being edited', function () {
    beforeAll(function () {
      this.initialState = {
        ...RESOURCES,
        items: {
          [EmptyKey]: {
            values: {
              id: 2,
              username: 'Bob',
            },
            status: { type: SUCCESS, syncedAt: 2, requestedAt: 1 },
          }
        }
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState);
      this.store.dispatch(this.clearUserEdit());
    });

    it('then does NOT change the status', function() {
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME);
    });

    it('then does NOT change the values', function() {
      expectToNotChangeResourceItemValues(this, RESOURCE_NAME);
    });
  });

  describe('Given the user attempts to clear the resource item when it is being edited', function () {
    beforeAll(function () {
      this.initialState = {
        ...RESOURCES,
        items: {
          [EmptyKey]: {
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
        }
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState);
      this.store.dispatch(this.clearUserEdit());
    });

    expectToClearResource();
  });

  describe('Given an update has failed to apply for a resource item', () => {
    beforeAll(function () {
      this.initialState = {
        ...RESOURCES,
        items: {
          [EmptyKey]: {
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
        }
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState);
      this.store.dispatch(this.clearUserEdit());
    });

    describe('when the user tries to clear the edit', () => {
      expectToClearResource();
    });
  });

  function expectToClearResource() {
    it('then changes the status type to SUCCESS', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', SUCCESS);
    });

    it('then does NOT change the syncedAt value in the status', function() {
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME, 'syncedAt');
    });

    it('then does NOT change the requestedAt value in the status', function() {
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME, 'requestedAt');
    });

    it('then clears the original values', function() {
      expectToClearResourceItemStatus(this, RESOURCE_NAME, 'originalValues');
    });

    it('then clears the dirty bit', function() {
      expectToClearResourceItemStatus(this, RESOURCE_NAME, 'dirty');
    });

    it('then changes the values back to originalValues', function() {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.initialState.items[EmptyKey].status.originalValues);
    });
  }
});
