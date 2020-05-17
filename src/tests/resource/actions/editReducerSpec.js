import { resource, EDITING, ERROR, NEW, RESOURCES } from '../../../index';
import {
  expectToChangeResourceItemStatusTo,
  expectToChangeResourceItemValuesTo, expectToNotChangeResourceItemStatus, expectToNotChangeResourceItemValues,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Edit reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { editItem: editUser } } = resource({
      name: 'users',
      keyBy: 'id'
    }, {
      edit: true
    });

    this.editUser = editUser;
    this.reducers = reducers;
    this.newValues = { username: 'Bob' };
  });

  describe('Given there is NO resource in the store', () => {
    expectToWarnButCreateNewItem();
  });

  describe('Given a resource is in the store with a status of SUCCESS', () => {
    expectToStartEditingWithNewValues({ initialStatus: { type: ERROR, error: { code: 'INVALID_RESOURCE' } } });
  });

  describe('Given a new resource item exists in the store and the edit action controller is called to update it', () => {
    beforeAll(function () {
      spyOn(console, 'warn');

      setupState(this, getInitialState({ type: NEW }), this.newValues);
    });

    it('then warns that the edit action controller is not intended to edit new resource items', function() {
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: Use a editItem() to edit new items that have not yet been saved to an external API. Update ignored.'
      );
    });

    it('then does not update the new resource item\'s values or state', function() {
      expectToNotChangeResourceItemValues(this, RESOURCE_NAME);
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME);
    });
  });

  function expectToWarnButCreateNewItem() {
    beforeAll(function () {
      spyOn(console, 'warn');

      setupState(this, { ...RESOURCES }, this.newValues);
    });

    it('then warns about the missing item', function () {
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: Use newItem() to create a new item or check the arguments passed to editItem(). (A new item was created to contain the edit.)');
    });

    it('then adds an item with the correct values', function () {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });

    it('then adds an item with a status of EDITING', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', EDITING);
    });
  }

  function expectToStartEditingWithNewValues(options) {
    beforeAll(function () {
      setupState(this, getInitialState(options.initialStatus), this.newValues);
    });

    it('then updates the item\'s values', function () {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });

    it('then changes the item\'s status to EDITING', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, {
        type: EDITING,
        dirty: true,
        originalValues: { username: 'Robert' }
      });
    });
  }

  function setupState(context, initialState, newValues) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.editUser(newValues));
  }

  function getInitialState(status) {
    const base = {
      ...RESOURCES,
      items: {
        [EmptyKey]: {
          values: { username: 'Robert' },
          status
        }
      }
    };

    if (status.type === NEW) {
      base.newItemKey = EmptyKey;
    }

    return base;
  }

});
