import buildStore from '../../helpers/buildStore';
import { EDITING, SUCCESS } from '../../../constants/Statuses';
import { resources } from '../../../index';

describe('Clear edit reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearUserEdit } } = resources({
      name: 'users',
    }, {
      clearEdit: true
    });

    this.clearUserEdit = clearUserEdit;
    this.reducers = reducers;

    this.resourceBefore = {
      items: {
        1: {
          values: {
            id: 1,
            username: 'Jill',
          },
          status: {
            type: EDITING,
            syncedAt: 2,
            requestedAt: 1,
            dirty: 1,
            originalValues: {
              id: 1,
              username: 'Jillian',
            }
          },
        },
        2: {
          values: {
            id: 2,
            username: 'Bob',
          },
          status: { type: SUCCESS, syncedAt: 2, requestedAt: 1 },
        },
      },
      selectionMap: { },
      newItemKey: null
    };
  });

  describe('Given the user attempts to clear a resource item that isn\'t in the store', function () {
    beforeAll(function () {
      this.store = buildStore({ users: { ...this.resourceBefore, newItemKey: null } }, { users: this.reducers } );
      this.store.dispatch(this.clearUserEdit(100));
    });

    it('then DOES nothing', function() {
      expect(this.store.getState().users).toEqual(this.resourceBefore);
    });
  });

  describe('Given the user attempts to clear a resource item that is NOT being edited', function () {
    beforeAll(function () {
      this.store = buildStore({ users: { ...this.resourceBefore, newItemKey: null } }, { users: this.reducers } );
      this.store.dispatch(this.clearUserEdit(2));
    });

    it('then does NOT change the status', function() {
      expect(this.store.getState().users.items['2'].status).toEqual({ type: SUCCESS, syncedAt: 2, requestedAt: 1 });
    });

    it('then does NOT change the values', function() {
      expect(this.store.getState().users.items['2'].values).toEqual({ id: 2, username: 'Bob', });
    });
  });

  describe('Given the user attempts to clear a resource item that is being edited', function () {
    beforeAll(function () {
      this.store = buildStore({ users: { ...this.resourceBefore, newItemKey: null } }, { users: this.reducers } );
      this.store.dispatch(this.clearUserEdit(1));
    });

    it('then changes the status type to SUCCESS', function() {
      expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
    });

    it('then does NOT change the syncedAt value in the status', function() {
      expect(this.store.getState().users.items['1'].status.syncedAt).toEqual(2);
    });

    it('then does NOT change the requestedAt value in the status', function() {
      expect(this.store.getState().users.items['1'].status.requestedAt).toEqual(1);
    });

    it('then clears the original values', function() {
      expect(this.store.getState().users.items['1'].status.originalValues).toEqual(undefined);
    });

    it('then clears the dirty bit', function() {
      expect(this.store.getState().users.items['1'].status.dirty).toEqual(undefined);
    });

    it('then changes the values back to originalValues', function() {
      expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Jillian', });
    });
  });

  describe('Given an update has failed to apply for a resource item', () => {
    beforeAll(function () {
      this.store = buildStore(
        {
          users: {
            items: {
              1: {
                values: {
                  username: 'Robert',
                  id: 1
                },
                status: {
                  dirty: true,
                  originalValues: {
                    username: 'Bobert',
                    id: 1
                  },
                  type: 'ERROR',
                  requestedAt: 2,
                  syncedAt: 1,
                  httpCode: 404,
                  error: {
                    message: 'Not Found',
                  }
                },
                projection: {
                  type: 'COMPLETE'
                }
              }
            },
            collections: {},
            selectionMap: {},
            newItemKey: null
          }
        },
        { users: this.reducers }
      );

      this.store.dispatch(this.clearUserEdit(1));
    });

    it('then changes the status type to SUCCESS', function() {
      expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
    });

    it('then does NOT change the syncedAt value in the status', function() {
      expect(this.store.getState().users.items['1'].status.syncedAt).toEqual(1);
    });

    it('then does NOT change the requestedAt value in the status', function() {
      expect(this.store.getState().users.items['1'].status.requestedAt).toEqual(2);
    });

    it('then clears the original values', function() {
      expect(this.store.getState().users.items['1'].status.originalValues).toEqual(undefined);
    });

    it('then clears the dirty bit', function() {
      expect(this.store.getState().users.items['1'].status.dirty).toEqual(undefined);
    });

    it('then clears the error details', function() {
      const { status } = this.store.getState().users.items['1'];

      expect(status.error).toEqual(undefined);
      expect(status.httpCode).toEqual(undefined);
    });

    it('then changes the values back to originalValues', function() {
      expect(this.store.getState().users.items['1'].values).toEqual({
        username: 'Bobert',
        id: 1
      });
    });
  });
});
