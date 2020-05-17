import { NEW, resource, SUCCESS } from '../../../index';
import EmptyKey from '../../../constants/EmptyKey';

import {
  expectToNotChangeResourceItemStatus, expectToChangeNewItemKeyTo, expectToChangeSelectionMapTo, setupInitialState,
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Clear new reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearNewItem: clearNewUser } } = resource({
      name: RESOURCE_NAME,
    }, {
      clearNew: true
    });

    this.clearNewUser = clearNewUser;
    this.reducers = reducers;
  });

  describe('when the resource is NOT new', function () {
    beforeAll(function () {
      this.initialState = {
        items: {
          [EmptyKey]: {
            values: {
              id: 2,
              username: 'Jill',
            },
            status: { type: SUCCESS },
          }
        },
        newItemKey: null
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState);

      this.store.dispatch(this.clearNewUser());
    });

    it('then does NOT change the resource\'s status', function() {
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME);
    });
  });

  describe('when the resource is new', function () {
    beforeAll(function () {
      this.initialState = {
        values: {
          id: 2,
          username: 'Jill',
        },
        status: { type: NEW },
      };

      setupInitialState(this, RESOURCE_NAME, {
        items: {
          [EmptyKey]: this.initialState
        },
        newItemKey: EmptyKey,
        selectionMap: { [EmptyKey]: true }
      });

      this.store.dispatch(this.clearNewUser());
    });

    it('then clears the newItemKey', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, null);
    });

    it('then removes the resource\'s key from the selectionMap', function() {
      expectToChangeSelectionMapTo(this, RESOURCE_NAME, {});
    });
  });
});
