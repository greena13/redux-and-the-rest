import buildStore from '../../helpers/buildStore';
import { resources, SUCCESS } from '../../../index';

describe('Select another reducer:', function () {
  beforeAll(function () {
    const { reducers, selectAnotherUser } = resources({
      name: 'users',
    }, {
      selectAnother: true
    });

    this.selectAnotherUser = selectAnotherUser;
    this.reducers = reducers;

    this.resourceBefore = {
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
      collections: {},
      newItemKey: null
    };
  });

  describe('when the resource is not in the store', function () {
    beforeAll(function () {
      this.store = buildStore({
        users: {
          ...this.resourceBefore,
          selectionMap: { }
        }
      }, { users: this.reducers } );

      spyOn(console, 'warn');

      this.store.dispatch(this.selectAnotherUser(3));

      this.users = this.store.getState().users;
    });

    it('then warns about the resource not being in the store', function() {
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: selectMap is not intended to hold references to items that are not in the store. SELECT_ANOTHER_USER\'s key \'3\' did not match any of the item keys: 1, 2. Check the options passed to selectAnother*(). (The selection was ignored.)'
      );
    });

    it('then does not change selectionMap', function() {
      expect(this.users.selectionMap).toEqual({ });
    });
  });

  describe('when the resource is in the store', function () {
    beforeAll(function () {
      this.nextSelected = 1;
    });

    describe('and there are no resources already selected', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            ...this.resourceBefore,
            selectionMap: {},
          }
        }, { users: this.reducers } );

        spyOn(console, 'warn');

        this.store.dispatch(this.selectAnotherUser(this.nextSelected));

        this.users = this.store.getState().users;
      });

      it('then add the item to the selectionMap', function() {
        expect(this.users.selectionMap).toEqual({ 1: true });
      });
    });

    describe('and there is already resources selected', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            ...this.resourceBefore,
            selectionMap: { 2: true },
          }
        }, { users: this.reducers } );

        spyOn(console, 'warn');

        this.store.dispatch(this.selectAnotherUser(this.nextSelected));

        this.users = this.store.getState().users;
      });

      it('then adds the newly selected item to those already selected', function() {
        expect(this.users.selectionMap).toEqual({ 1: true, 2: true });
      });
    });
  });

  describe('when the item\'s id is passed as an object to the action creator', function () {
    beforeAll(function () {
      this.nextSelected = 1;
    });

    describe('and there are no resources already selected', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            ...this.resourceBefore,
            selectionMap: {},
          }
        }, { users: this.reducers } );

        spyOn(console, 'warn');

        this.store.dispatch(this.selectAnotherUser({ id: this.nextSelected }));

        this.users = this.store.getState().users;
      });

      it('then add the item to the selectionMap', function() {
        expect(this.users.selectionMap).toEqual({ 1: true });
      });
    });
  });
});
