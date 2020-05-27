import {
  resource,
  DESTROY_ERROR, DESTROYING, EDITING, ERROR, NEW, SUCCESS, UPDATING, RESOURCES, CREATING
} from '../../../index';
import {
  expectToChangeNewItemKeyTo,
  expectToChangeResourceItemStatusTo,
  expectToChangeResourceItemValuesTo,
  resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('New reducer:', () => {
  beforeAll(function () {
    const { reducers, actionCreators: { newItem: newUser } } = resource({
      name: 'users',
      keyBy: 'id'
    }, {
      newItem: true
    });

    this.newUser = newUser;
    this.reducers = reducers;

  });

  describe('Given the resource does not yet exist', () => {
    expectToAddNewItem();
  });

  describe('Given the resource already has a status of NEW', function () {
     expectToChangeToNewItem(NEW);
  });

  describe('Given the resource already has a status of SUCCESS', function () {
     expectToChangeToNewItem(SUCCESS);
  });

  describe('Given the resource already has a status of CREATING', function () {
     expectToChangeToNewItem(CREATING);
  });

  describe('Given the resource already has a status of EDITING', function () {
     expectToChangeToNewItem(EDITING);
  });

  describe('Given the resource already has a status of UPDATING', function () {
     expectToChangeToNewItem(UPDATING);
  });

  describe('Given the resource already has a status of ERROR', function () {
     expectToChangeToNewItem(ERROR);
  });

  describe('Given the resource already has a status of DESTROYING', function () {
     expectToChangeToNewItem(DESTROYING);
  });

  describe('Given the resource already has a status of DESTROY_ERROR', function () {
     expectToChangeToNewItem(DESTROY_ERROR);
  });

  function expectToAddNewItem() {
    beforeAll(function () {
      this.newValues = { username: 'Jill', };

      setupState(this, { ...RESOURCES }, this.newValues);
    });

    it('then adds the new item', function () {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });

    it('then sets the status type of the new item to NEW', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', NEW);
    });

    it('then sets the newItemKey', function () {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
    });

    it('then does NOT add the key of the new item to the default list', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual({});
    });
  }

  function expectToChangeToNewItem(status) {
    beforeAll(function () {
      this.previousItemId = 'previous';
      this.newValues = { username: 'Jill' };

      const initialState = {
        ...RESOURCES,
        items: {
          [EmptyKey]: {
            values: { username: 'Bob' },
            status: { type: status }
          }
        },
        lists: {
          [EmptyKey]: {
            positions: [ EmptyKey ]
          }
        } };

      if (status === NEW) {
        initialState.newItemKey = EmptyKey;
      }

      spyOn(console, 'warn');

      setupState(this, initialState, this.newValues);
    });

    it('then changes the values of then existing item', function() {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });

    it('then sets the item\'s status type to NEW', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', NEW);
    });

    it('then sets the newItemKey to point to the new item', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
    });
  }

  function setupState(context, initialState, newValues, options) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    if (options) {
      context.store.dispatch(context.newUser(newValues, options));
    } else {
      context.store.dispatch(context.newUser(newValues));
    }
  }
});
