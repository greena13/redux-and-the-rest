import { resource, NEW, SUCCESS, RESOURCES } from '../../../index';
import {
  expectToChangeResourceItemValuesTo,
  expectToNotChangeResourceItemStatus,
  expectToNotChangeResourceItemValues,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Edit new reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { editNewItem: editNewUser } } = resource({
      name: 'users',
      keyBy: 'id'
    }, {
      editNew: true
    });

    this.editNewUser = editNewUser;
    this.reducers = reducers;

    this.newValues = { username: 'Bob' };
  });

  describe('Given there is no existing resource item', () => {
    describe('When the action creator is called', () => {
      beforeAll(function () {
        spyOn(console, 'warn');

        setupState(this, { ...RESOURCES }, this.newValues);
      });

      it('then warns about the missing item', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          'Redux and the REST: Use newItem() to create a new item first, or check the arguments passed to editItem(). Update ignored.');
      });
    });
  });

  describe('Given the resource item is NOT new', () => {
    beforeAll(function () {
      spyOn(console, 'warn');

      setupState(this, getInitialState(SUCCESS), this.newValues);
    });

    it('then warns attempting to edit a resource item that is not NEW', function() {
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: Use newItem() to create a new item first, or check the arguments passed to editItem(). Update ignored.');
    });

    it('then doesn\'t update the item', function() {
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME);
      expectToNotChangeResourceItemValues(this, RESOURCE_NAME);
    });
  });

  describe('Given the resource item is new', () => {
    beforeAll(function () {
      setupState(this, getInitialState(NEW), this.newValues);
    });

    it('then updates the item\'s values', function() {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });

    it('then leaves the item\'s status as NEW', function() {
      expectToNotChangeResourceItemStatus(this, RESOURCE_NAME);
    });
  });

  function setupState(context, initialState, newValues) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.editNewUser(newValues));
  }

  function getInitialState(statusType) {
    const base = {
      ...RESOURCES,
      items: {
        [EmptyKey]: {
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
      base.newItemKey = EmptyKey;
    }

    return base;
  }
});
