import { resources, NEW, SUCCESS, RESOURCES } from '../../../index';
import {
  expectToChangeResourcesItemValuesTo,
  expectToNotChangeResourcesItemStatus,
  expectToNotChangeResourcesItemValues,
  setupInitialState
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Edit new reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { editNewItem: editNewUser } } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      editNewItem: true
    });

    this.editNewUser = editNewUser;
    this.reducers = reducers;

    this.newValues = { username: 'Bob' };
  });

  describe('Given there is no existing new resource item', () => {
    describe('and the action creator is called with no params arguments', () => {
      beforeAll(function () {
        spyOn(console, 'warn');

        setupState(this, { ...RESOURCES }, this.newValues);
      });

      it('then warns about the missing item', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          'Redux and the REST: EDIT_NEW_USER\'s key \'null\' does not match any new items in the store. Use newItem() to create a new item first, or check the arguments passed to editItem(). Update ignored.');
      });
    });

    describe('and the action creator is called with a params arguments', () => {
      beforeAll(function () {
        spyOn(console, 'warn');

        setupState(this, { ...RESOURCES }, 'temp', this.newValues);
      });

      it('then warns about the missing item', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          'Redux and the REST: EDIT_NEW_USER\'s key \'temp\' does not match any new items in the store. Use newItem() to create a new item first, or check the arguments passed to editItem(). Update ignored.');
      });
    });
  });

  describe('Given the editNew action creator is called with params', () => {
    describe('that match a resource item that is not new', () => {
      beforeAll(function () {
        spyOn(console, 'warn');

        this.id = 1;

        setupState(this, getInitialState(this.id, SUCCESS), this.id, this.newValues);
      });

      it('then warns attempting to edit a resource item that is not NEW', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          `Redux and the REST: EDIT_NEW_USER\'s key \'${this.id}\' matches a resource that is NOT new. Use a editItem() to edit existing items. Update ignored.`);
      });

      it('then doesn\'t update the item', function() {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.id);
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.id);
      });
    });

    describe('that match the new resource item', () => {
      beforeAll(function () {
        this.id = 'temp';

        setupState(this, getInitialState(this.id, NEW), this.id, this.newValues);
      });

      it('then updates the item\'s values', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.id, this.newValues);
      });

      it('then leaves the item\'s status as NEW', function() {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.id);
      });
    });
  });

  describe('Given the editNew action creator is called without a params argument,', () => {
    beforeAll(function () {
      this.id = 'temp';

      setupState(this, getInitialState(this.id, NEW), this.newValues);
    });

    it('then updates the new item\'s values', function() {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.id, this.newValues);
    });

    it('then leaves the item\'s status as NEW', function() {
      expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.id, 'type');
    });
  });

  function setupState(context, initialState, paramsOrNewValues, newValues = undefined) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    if (newValues) {
      context.store.dispatch(context.editNewUser(paramsOrNewValues, newValues));
    } else {
      context.store.dispatch(context.editNewUser(paramsOrNewValues));
    }
  }

  function getInitialState(id, statusType) {
    const base = {
      ...RESOURCES,
      items: {
        [id]: {
          values: {
            username: 'Jane'
          },
          status: {
            type: statusType
          }
        }
      }
    };

    if (statusType === NEW) {
      base.newItemKey = id;
    }

    return base;
  }
});
