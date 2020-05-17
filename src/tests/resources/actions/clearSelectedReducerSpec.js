import { resources, SUCCESS } from '../../../index';
import {
  expectToNotChangeResourcesCollection,
  expectToNotChangeResourcesItem,
  expectToNotChangeSelectionMap, expectToChangeSelectionMapTo,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Clear selected reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearSelectedItems: clearSelectedUsers } } = resources({
      name: RESOURCE_NAME,
    }, {
      clearSelected: true
    });

    this.clearSelectedUsers = clearSelectedUsers;
    this.reducers = reducers;

    this.initialState = {
      items: {
        1: {
          values: {
            id: 1,
            username: 'Bob',
          },
          status: { type: SUCCESS },
        },
        2: {
          values: {
            id: 2,
            username: 'Jill',
          },
          status: { type: SUCCESS },
        }
      },
      collections: {
        [EmptyKey]: {
          positions: [ 1, 2 ],
          status: { type: null }
        }
      },

      newItemKey: null
    };
  });

  describe('when there are no resources selected', function () {
    beforeAll(function() {
      this.initialState = { ...this.initialState, selectionMap: {} };

      setupInitialState(this, RESOURCE_NAME, this.initialState);

      this.store.dispatch(this.clearSelectedUsers());
    });

    it('then does NOT change the selectionMap', function() {
      expectToNotChangeSelectionMap(this, RESOURCE_NAME);
    });
  });

  describe('when there are resources selected', function () {
    beforeAll(function() {
      this.initialState = { ...this.initialState, selectionMap: { 1: true, 2: true } };

      setupInitialState(this, RESOURCE_NAME, this.initialState);

      this.store.dispatch(this.clearSelectedUsers());
    });

    it('then clears the selectionMap', function() {
      expectToChangeSelectionMapTo(this, RESOURCE_NAME, {});
    });

    it('then DOES NOT remove the selected resources', function() {
      expectToNotChangeResourcesItem(this, RESOURCE_NAME, 1);
    });

    it('then DOES NOT remove the selected resources from collections', function() {
      expectToNotChangeResourcesCollection(this, RESOURCE_NAME, EmptyKey, 'positions', [ 1, 2 ]);
    });
  });
});
