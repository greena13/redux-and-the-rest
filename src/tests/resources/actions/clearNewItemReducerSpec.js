import { resources, EDITING, NEW, RESOURCES } from '../../../index';
import {
  expectToNotChangeNewItemKey,
  expectToNotChangeResourcesList,
  expectToNotChangeSelectionMap,
  expectToChangeNewItemKeyTo,
  expectToChangeResourceListPositionsTo,
  expectToChangeSelectionMapTo,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Clear new reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearNewItem: clearNewUser } } = resources({
      name: RESOURCE_NAME,
    }, {
      clearNewItem: true
    });

    this.clearNewUser = clearNewUser;
    this.reducers = reducers;
  });

  beforeAll(function () {
    this.initialState = {
      ...RESOURCES,
      items: {
        1: {
          values: {
            id: 2,
            username: 'Jill',
          },
          status: { type: NEW },
        },
        'temp': {
          values: {
            id: 2,
            username: 'Jill',
          },
          status: { type: NEW },
        },
      },
      lists: {
        [EmptyKey]: {
          positions: ['temp', 1],
          status: { type: EDITING },
        }
      },
      selectionMap: { temp: true, 1: true },
    };
  });

  describe('when there is NO new resource', function () {
    beforeAll(function () {
      setupInitialState(this, RESOURCE_NAME, this.initialState);

      this.store.dispatch(this.clearNewUser());
    });

    it('then DOES NOT clear the newItemKey', function() {
      expectToNotChangeNewItemKey(this, RESOURCE_NAME);
    });

    it('then DOES NOT remove the resource\'s key from the selectionMap', function() {
      expectToNotChangeSelectionMap(this, RESOURCE_NAME);
    });

    it('then DOES NOT remove the resource\'s key from any lists', function() {
      expectToNotChangeResourcesList(this, RESOURCE_NAME, EmptyKey, 'positions');
    });
  });

  describe('when there is a new resource', function () {
    beforeAll(function () {
      this.initialState = {
        ...this.initialState,
        newItemKey: 'temp'
      };

      setupInitialState(this, RESOURCE_NAME, this.initialState);

      this.store.dispatch(this.clearNewUser());
    });

    it('then clears the newItemKey', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, null);
    });

    it('then removes the resource\'s key from the selectionMap', function() {
      expectToChangeSelectionMapTo(this, RESOURCE_NAME, { 1: true });
    });

    it('then removes the resource\'s key from any lists', function() {
      expectToChangeResourceListPositionsTo(this, RESOURCE_NAME, EmptyKey, [1]);
    });
  });
});
