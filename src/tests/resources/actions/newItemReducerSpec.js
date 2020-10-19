import {
  resources,
  CREATING, DESTROY_ERROR, DESTROYING, EDITING, ERROR, NEW, SUCCESS, UPDATING, RESOURCES
} from '../../../index';
import {
  expectToChangeNewItemKeyTo, expectToChangeResourceListPositionsTo,
  expectToChangeResourcesItemStatusTo,
  expectToChangeResourcesItemValuesTo, expectToNotChangeResourceListPositions,
  expectToNotChangeResourcesItemStatus,
  expectToNotChangeResourcesItemValues,
  resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';
import without from '../../../utils/list/without';

const RESOURCE_NAME = 'users';

describe('New reducer:', () => {
  beforeAll(function () {
    const { reducers, actionCreators: { newItem: newUser } } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      newItem: true
    });

    this.newUser = newUser;
    this.reducers = reducers;
  });

  describe('Given there is NOT already a new item', () => {
    describe('When only the item\'s id is passed to the action creator', () => {
      expectToAddNewItem('temp');
    });

    describe('When the item\'s id is passed as an object to the action creator', () => {
      expectToAddNewItem({ id: 'temp' });
    });
  });

  describe('Given newItemKey already points to a resource with a status of NEW', () => {
    expectToChangeNewItem(NEW);
  });

  describe('Given newItemKey already points to a resource with a status of EDITING', () => {
    expectToChangeNewItem(EDITING);
  });

  describe('Given newItemKey already points to a resource with a status of CREATING', () => {
    expectToChangeNewItem(CREATING);
  });

  describe('Given newItemKey already points to a resource with a status of ERROR', () => {
    expectToChangeNewItem(ERROR);
  });

  describe('Given there is already an item with the same key with a status of SUCCESS', function () {
     expectToChangeToNewItem(SUCCESS);
  });

  describe('Given there is already an item with the same key with a status of EDITING', function () {
     expectToChangeToNewItem(EDITING);
  });

  describe('Given there is already an item with the same key with a status of UPDATING', function () {
     expectToChangeToNewItem(UPDATING);
  });

  describe('Given there is already an item with the same key with a status of ERROR', function () {
     expectToChangeToNewItem(ERROR);
  });

  describe('Given there is already an item with the same key with a status of DESTROYING', function () {
     expectToChangeToNewItem(DESTROYING);
  });

  describe('Given there is already an item with the same key with a status of DESTROY_ERROR', function () {
     expectToChangeToNewItem(DESTROY_ERROR);
  });

  describe('when the push lists operator is used', () => {
    expectToAddNewItemToListsPositions('push', 1, [1], [2, 1]);
  });

  describe('when the unshift lists operator is used', () => {
    expectToAddNewItemToListsPositions('unshift', 1, [1], [1, 2]);
  });

  describe('when the invalidate lists operator is used', () => {
    describe('and there are NO lists', function () {
      beforeAll(function () {
        this.listId = 'order=newest';

        setupState(this, { ...RESOURCES }, 1, this.newValues, { invalidate: { order: 'newest' } });
      });

      it('then does not create any lists', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual({ });
      });
    });

    describe('and there are NO matching lists', function () {
      beforeAll(function () {
        this.listId = 'order=newest';
        this.otherListId = 'active=true';

        this.initialState = {
          ...RESOURCES,
          lists: {
            [this.otherListId]: {
              positions: [],
              status: { type: SUCCESS },
              metadata: { type: null }
            }
          }
        };

        setupState(this, this.initialState, 1, this.newValues, { invalidate: { order: 'newest' } });
      });

      it('then does not create any lists', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual(this.initialState.lists);
      });
    });

    describe('and there are lists with keys that exactly match', function () {
      beforeAll(function () {
        this.listId = 'order=newest';
        this.otherListId = 'active=true';

        this.initialState = {
          ...RESOURCES,
          lists: {
            [this.otherListId]: {
              positions: [],
              status: { type: SUCCESS },
              metadata: { type: null }
            },
            [this.listId]: {
              positions: [2],
              status: { type: SUCCESS }
            },
          }
        };

        setupState(this, this.initialState, 1, this.newValues, { invalidate: { order: 'newest' } });
      });

      it('then clears the positions of the matching lists', function () {
        expectToChangeResourceListPositionsTo(this, RESOURCE_NAME, this.listId, []);
      });
    });
  });

  function expectToAddNewItem(params) {
    beforeAll(function () {
      this.id = 'temp';
      this.newValues = { username: 'Jill', };

      setupState(this, { ...RESOURCES }, params, this.newValues);
    });

    it('then adds the new item', function () {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.id, this.newValues);
    });

    it('then sets the status type of the new item to NEW', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.id, 'type', NEW);
    });

    it('then sets the newItemKey', function () {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, this.id);
    });

    it('then does NOT add the key of the new item to the default list', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual({});
    });
  }

  function expectToChangeNewItem(status) {
    beforeAll(function () {
      this.previousItemId = 'previous';
      this.id = 'temp';
      this.newValues = { username: 'Jill', };

      spyOn(console, 'warn');

      setupState(this, {
        ...RESOURCES,
        items: {
          [this.previousItemId]: {
            values: { username: 'Bob' },
            status: { type: status }
          }
        },
        newItemKey: this.previousItemId,
        lists: {
          [EmptyKey]: {
            positions: [ this.previousItemId ]
          }
        } }, this.id, this.newValues);
    });

    it('then DOES NOT warn about the existing new record', function() {
      // eslint-disable-next-line no-console
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('then DOES NOT change the values of the previous item', function() {
      expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.previousItemId);
      expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.previousItemId);
    });

    it('then adds the new item', function() {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.id, this.newValues);
    });

    it('then sets the new item\'s status type to NEW', function() {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.id, 'type', NEW);
    });

    it('then does NOT add the key of the new item to the default list', function() {
      expectToNotChangeResourceListPositions(this, RESOURCE_NAME, EmptyKey);
    });
  }

  function expectToChangeToNewItem(status) {
    beforeAll(function () {
      this.previousItemId = 'previous';
      this.id = 'temp';
      this.newValues = { username: 'Jill' };

      const initialState = {
        ...RESOURCES,
        items: {
          [this.id]: {
            values: { username: 'Bob' },
            status: { type: status }
          }
        },
        lists: {
          [EmptyKey]: {
            positions: [ this.id ]
          }
        } };

      if (status === NEW) {
        initialState.newItemKey = this.id;
      }

      spyOn(console, 'warn');

      setupState(this, initialState, this.id, this.newValues);
    });

    it('then warns about the existing record with the same key', function() {
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        `Redux and the REST: \'NEW_USER\' has same key \'${this.id}\' as existing item, use editItem() to update it instead, or clearNewItem() if you want to discard the previous values. (The previous item was overridden with new values.)`
      );
    });

    it('then changes the values of then existing item', function() {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.id, this.newValues);
    });

    it('then sets the item\'s status type to NEW', function() {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.id, 'type', NEW);
    });

    it('then sets the newItemKey to point to the new item', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, this.id);
    });
  }

  function expectToAddNewItemToListsPositions(operator, itemId, expectedIsolatedState, expectedCumulativeState) {
    describe('and there are NO lists', function () {
      beforeAll(function () {
        this.listId = 'order=newest';

        setupState(this, { ...RESOURCES }, itemId, this.newValues, { [operator]: { order: 'newest' } });
      });

      it('then creates a new list with the specified key and places the item in it', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual(this.initialState.lists);
      });
    });

    describe('and there are NO matching lists', function () {
      beforeAll(function () {
        this.listId = 'order=newest';
        this.otherListId = 'active=true';

        this.initialState = {
          ...RESOURCES,
          lists: {
            [this.otherListId]: {
              positions: [],
              status: { type: SUCCESS },
              metadata: { type: null }
            }
          }
        };

        setupState(this, this.initialState, itemId, this.newValues, { [operator]: { order: 'newest' } });
      });

      it('then does not create any new lists', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual(this.initialState.lists);
      });
    });

    describe('and there are lists with keys that exactly match', function () {
      beforeAll(function () {
        this.listId = 'order=newest';
        this.otherListId = 'active=true';

        setupState(this, {
          ...RESOURCES,
          lists: {
            [this.otherListId]: {
              positions: [],
              status: { type: SUCCESS },
              metadata: { type: null }
            },
            [this.listId]: {
              positions: [2],
              status: { type: SUCCESS }
            },
          }
        }, itemId, this.newValues, { [operator]: { order: 'newest' } });
      });

      it('then adds the new item to the matching lists', function () {
        expectToChangeResourceListPositionsTo(this, RESOURCE_NAME, this.listId, expectedCumulativeState);
        expectToNotChangeResourceListPositions(this, RESOURCE_NAME, this.otherListId);
      });
    });
  }

  function setupState(context, initialState, params, newValues, options) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    if (options) {
      context.store.dispatch(context.newUser(params, newValues, options));
    } else {
      context.store.dispatch(context.newUser(params, newValues));
    }
  }
});
