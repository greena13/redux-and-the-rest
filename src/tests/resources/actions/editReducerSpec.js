import { resources, EDITING, ERROR, NEW, RESOURCES } from '../../../index';
import {
  expectToChangeResourcesItemStatusTo,
  expectToChangeResourcesItemValuesTo, expectToNotChangeResourcesItemStatus, expectToNotChangeResourcesItemValues,
  setupInitialState
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Edit reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { editUser } } = resources({
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
    describe('When the action creator is called with the item\'s id', () => {
      expectToWarnButCreateNewItem(1, 1);
    });

    describe('When the action creator is called with the item\'s id as an object', () => {
      expectToWarnButCreateNewItem(1, { id: 1 });
    });
  });

  describe('Given a resource is in the store with a status of SUCCESS', () => {
    describe('When the action creator is called with the item\'s id', () => {
      expectToStartEditingWithNewValues(1, 1, { initialStatus: { type: ERROR, error: { code: 'INVALID_RESOURCE' } } });
    });

    describe('When the action creator is called with the item\'s id as an object', () => {
      expectToStartEditingWithNewValues(1, { id: 1 }, { initialStatus: { type: ERROR, error: { code: 'INVALID_RESOURCE' } } });
    });
  });

  describe('Given a new resource item exists in the store and the edit action controller is called to update it', () => {
    beforeAll(function () {
      spyOn(console, 'warn');

      this.id = 'temp';

      setupState(this, getInitialState(this.id, { type: NEW }), this.id, this.newValues);
    });

    it('then warns that the edit action controller is not intended to edit new resource items', function() {
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: EDIT_USER\'s key \'temp\' matches a NEW item. Use a editNewUser() to edit new items that have not yet been saved to an external API. Update ignored.'
      );
    });

    it('then does not update the new resource item\'s values or state', function() {
      expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.id);
      expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.id);
    });
  });

  function getInitialState(id, status) {
    const base = {
      ...RESOURCES,
      items: {
        [id]: {
          values: { username: 'Robert' },
          status
        }
      }
    };

    if (status.type === NEW) {
      base.newItemKey = id;
    }

    return base;
  }

  function setupState(context, initialState, params, newValues) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.editUser(params, newValues));
  }

  function expectToWarnButCreateNewItem(id, params) {
    beforeAll(function () {
      spyOn(console, 'warn');

      setupState(this, { ...RESOURCES }, params, this.newValues);
    });

    it('then warns about the missing item', function () {
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: EDIT_USER\'s key \'1\' does not match any items in the store. Use newUser() to create a new item or check the arguments passed to editUser(). (A new item was created to contain the edit.)');
    });

    it('then adds an item with the correct values', function () {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, id, this.newValues);
    });

    it('then adds an item with a status of EDITING', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', EDITING);
    });
  }

  function expectToStartEditingWithNewValues(id, params, options) {
    beforeAll(function () {
      setupState(this, getInitialState(id, options.initialStatus), params, this.newValues);
    });

    it('then updates the item\'s values', function () {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, id, this.newValues);
    });

    it('then changes the item\'s status to EDITING', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, {
        type: EDITING,
        dirty: true,
        originalValues: { username: 'Robert' }
      });
    });
  }
});
