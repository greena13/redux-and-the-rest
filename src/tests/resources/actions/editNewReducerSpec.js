import buildStore from '../../helpers/buildStore';
import { resources, EDITING, ERROR, NEW, SUCCESS } from '../../../index';

describe('Edit new reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { editNewUser } } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      editNew: true
    });

    this.editNewUser = editNewUser;
    this.reducers = reducers;

    this.resourceBefore = {
      collections: {},
      selectionMap: { },
      newItemKey: null
    };
  });

  describe('Given there is no existing new resource item', function () {
    describe('and the action creator is called with no params arguments', () => {
      beforeAll(function () {
        this.store = buildStore({
          users: { ...this.resourceBefore, items: {} }
        }, {
          users: this.reducers
        });

        spyOn(console, 'warn');

        this.store.dispatch(this.editNewUser({ username: 'Bob' }));
      });

      it('then warns about the missing item', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          'Redux and the REST: EDIT_NEW_USER\'s key \'null\' does not match any new items in the store. Use newUser() to create a new item first, or check the arguments passed to editNewUser(). Update ignored.');
      });
    });

    describe('and the action creator is called with a params arguments', () => {
      beforeAll(function () {
        this.store = buildStore({
          users: { ...this.resourceBefore, items: {} }
        }, {
          users: this.reducers
        });

        spyOn(console, 'warn');

        this.store.dispatch(this.editNewUser('temp', { username: 'Bob' }));
      });

      it('then warns about the missing item', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          'Redux and the REST: EDIT_NEW_USER\'s key \'temp\' does not match any new items in the store. Use newUser() to create a new item first, or check the arguments passed to editNewUser(). Update ignored.');
      });
    });
  });

  describe('Given the editNew action creator is called with params', () => {
    describe('that match a resource item that is not new', () => {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            ...this.resourceBefore,
            items: {
              1: {
                values: {
                  username: 'Jane'
                },
                status: {
                  type: SUCCESS
                }
              }
            }
          }
        }, {
          users: this.reducers
        });

        spyOn(console, 'warn');

        this.store.dispatch(this.editNewUser(1, { username: 'Bob' }));
      });

      it('then warns attempting to edit a resource item that is not NEW', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(
          'Redux and the REST: EDIT_NEW_USER\'s key \'1\' matches a resource that is NOT new. Use a editUser() to edit existing items. Update ignored.');
      });

      it('then doesn\'t update the item', function() {
        expect(this.store.getState().users.items[1]).toEqual({
          values: {
            username: 'Jane'
          },
          status: {
            type: SUCCESS
          }
        });
      });
    });

    describe('that match the new resource item', () => {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            ...this.resourceBefore,
            items: {
              temp: {
                values: {
                  username: 'Jane'
                },
                status: {
                  type: NEW
                }
              }
            },
            newItemKey: 'temp'
          }
        }, {
          users: this.reducers
        });

        this.store.dispatch(this.editNewUser('temp', { username: 'Bob' }));
      });

      it('then updates the item\'s values', function() {
        expect(this.store.getState().users.items.temp.values).toEqual({
          username: 'Bob'
        });
      });

      it('then leaves the item\'s status as NEW', function() {
        expect(this.store.getState().users.items.temp.status).toEqual({
          type: NEW
        });
      });
    });
  });

  describe('Given the editNew action creator is called without a params argument,', () => {
    beforeAll(function () {
      this.store = buildStore({
        users: {
          ...this.resourceBefore,
          items: {
            temp: {
              values: {
                username: 'Jane'
              },
              status: {
                type: NEW
              }
            }
          },
          newItemKey: 'temp'
        }
      }, {
        users: this.reducers
      });

      this.store.dispatch(this.editNewUser({ username: 'Bob' }));
    });

    it('then updates the new item\'s values', function() {
      expect(this.store.getState().users.items.temp.values).toEqual({
        username: 'Bob'
      });
    });

    it('then leaves the item\'s status as NEW', function() {
      expect(this.store.getState().users.items.temp.status).toEqual({
        type: NEW
      });
    });

  });
});
