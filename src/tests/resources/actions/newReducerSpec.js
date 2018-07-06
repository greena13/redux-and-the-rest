import buildStore from '../../helpers/buildStore';
import {
  resources,
  CREATING, DESTROY_ERROR, DESTROYING, EDITING, ERROR, NEW, SUCCESS, UPDATING
} from '../../../index';

describe('New reducer:', () => {
  beforeAll(function () {
    const { reducers, newUser } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      new: true
    });

    this.newUser = newUser;
    this.reducers = reducers;

    this.resourceBefore = {
      items: {},
      collections: {},
      selectionMap: { },
      newItemKey: null
    };

  });

  describe('when there is NOT already a new item', () => {
    [
      {
        idArgsDescription: 'and only the item\'s id is passed to the action creator',
        idArgs: 'temp'
      },
      {
        idArgsDescription: 'and the item\'s id is passed as an object to the action creator',
        idArgs: { id: 'temp' }
      }
    ].forEach(({ idArgsDescription, idArgs }) => {
      describe(idArgsDescription, () => {
        beforeAll(function () {
          this.store = buildStore({
              users: {
                ...this.resourceBefore,
                items: {},
                newItemKey: null,
              }
            },
            { users: this.reducers }
          );

          this.store.dispatch(this.newUser(idArgs, {
            id: 2,
            username: 'Jill',
          }));

          this.users = this.store.getState().users;
        });

        it('then adds the new item', function() {
          expect(this.users.items.temp.values).toEqual({ id: 2, username: 'Jill' });
        });

        it('then sets the status type of the new item to NEW', function() {
          expect(this.users.items.temp.status.type).toEqual(NEW);
        });

        it('then sets the newItemKey', function() {
          expect(this.users.newItemKey).toEqual('temp');
        });

        it('then does NOT add the key of the new item to the default collection', function() {
          expect(this.users.collections).toEqual({});
        });
      });
    });
  });

  describe('when newItemKey already points to a resource', () => {
    [
      {
        description: 'with a status of NEW',
        status: { type: NEW },
      },
      {
        description: 'with a status of EDITING',
        status: { type: EDITING },
      },
      {
        description: 'with a status of CREATING',
        status: { type: CREATING },
      },
      {
        description: 'with a status of ERROR',
        status: { type: ERROR },
      },
    ].forEach(({ description, status }) => {

      describe(description, function() {

        beforeAll(function () {
          this.store = buildStore({
              users: {
                ...this.resourceBefore,
                items: {
                  temp: {
                    values: { username: 'Bob' },
                    status
                  }
                },
                newItemKey: 'temp',
                collections: {
                  '': {
                    positions: [ 'temp' ]
                  }
                }
              }
            },
            { users: this.reducers }
          );

          spyOn(console, 'warn');

          this.store.dispatch(this.newUser('temp', {
            username: 'Jill',
          }));

          this.users = this.store.getState().users;
        });

        it('then warns about the existing new record with the same key', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: \'NEW_USER\' has same key \'temp\' as the previous new item, which has not finished saving to the server. If you wish to create new items before the previous ones have finished saving, ensure you use unique temporary keys. If you want to discard the previous item, use the clearNew*() action. (Previous item was overridden with new values.)'
          );
        });

        it('then changes the values of then new item', function() {
          expect(this.users.items.temp.values).toEqual({ username: 'Jill' });
        });

        it('then sets the item\'s status type to NEW', function() {
          expect(this.users.items.temp.status.type).toEqual(NEW);
        });

        it('then does NOT add the key of the new item to the default collection', function() {
          expect(this.users.collections[''].positions).toEqual([ 'temp' ]);
        });
      });
    });

    describe('with a different key', function () {
      beforeAll(function () {
        this.store = buildStore({
            users: {
              ...this.resourceBefore,
              items: {
                previous: {
                  values: { username: 'Bob' },
                  status: { type: NEW }
                }
              },
              newItemKey: 'previous',
              collections: {
                '': {
                  positions: [ 'previous' ]
                }
              }
            }
          },
          { users: this.reducers }
        );

        spyOn(console, 'warn');

        this.store.dispatch(this.newUser('temp', {
          username: 'Jill',
        }));

        this.users = this.store.getState().users;
      });

      it('then DOES NOT warn about the existing new record', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).not.toHaveBeenCalled();
      });

      it('then DOES NOT change the values of the previous item', function() {
        expect(this.users.items.previous.values).toEqual({ username: 'Bob' });
        expect(this.users.items.previous.status.type).toEqual(NEW);
      });

      it('then adds the new item', function() {
        expect(this.users.items.temp.values).toEqual({ username: 'Jill' });
      });

      it('then sets the new item\'s status type to NEW', function() {
        expect(this.users.items.temp.status.type).toEqual(NEW);
      });

      it('then does NOT add the key of the new item to the default collection', function() {
        expect(this.users.collections[''].positions).toEqual([ 'previous' ]);
      });
    });
  });

  describe('when there is already an item with the same key', function () {
    [
      {
        description: 'with a status of SUCCESS',
        status: { type: SUCCESS },
      },
      {
        description: 'with a status of EDITING',
        status: { type: EDITING },
      },
      {
        description: 'with a status of UPDATING',
        status: { type: UPDATING },
      },
      {
        description: 'with a status of ERROR',
        status: { type: ERROR },
      },
      {
        description: 'with a status of DESTROYING',
        status: { type: DESTROYING },
      },
      {
        description: 'with a status of DESTROY_ERROR',
        status: { type: DESTROY_ERROR },
      },
    ].forEach(({ description, status }) => {

      describe(description, function() {

        beforeAll(function () {
          this.store = buildStore({
              users: {
                ...this.resourceBefore,
                items: {
                  1: {
                    values: { username: 'Bob' },
                    status
                  }
                },
                collections: {
                  '': {
                    positions: [ 1 ]
                  }
                }
              }
            },
            { users: this.reducers }
          );

          spyOn(console, 'warn');

          this.store.dispatch(this.newUser(1, {
            username: 'Jill',
          }));

          this.users = this.store.getState().users;
        });

        it('then warns about the existing record with the same key', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: \'NEW_USER\' has same key \'1\' as existing item, use edit*() to update it instead, or clearNew*() if you want to discard the previous values. (Previous item was overridden with new values.)'
          );
        });

        it('then changes the values of then existing item', function() {
          expect(this.users.items[1].values).toEqual({ username: 'Jill' });
        });

        it('then sets the item\'s status type to NEW', function() {
          expect(this.users.items[1].status.type).toEqual(NEW);
        });

        it('then sets the newItemKey to point to the new item', function() {
          expect(this.users.newItemKey).toEqual(1);
        });
      });
    });
  });

  describe('when the collectionKeys attribute is used', () => {
    describe('and there are NO collections', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            items: {},
            collections: {},
            newItemKey: null
          }
        }, { users: this.reducers } );

        this.store.dispatch(this.newUser(1, {
          username: 'Jill',
        }, { order: 'newest' }));

        this.users = this.store.getState().users;
      });

      it('then creates a new collection with the specified key and places the item in it', function() {
        expect(this.users.collections).toEqual({
          'order=newest': {
            positions: [ 1 ],
            status: { type: null }
          }
        });
      });
    });

    describe('and there are NO matching collections', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            items: {},
            collections: {
              'active=true': {
                positions: [ ],
                status: { type: SUCCESS }
              }
            },
            newItemKey: null
          }
        }, { users: this.reducers } );

        this.store.dispatch(this.newUser(1, {
          username: 'Jill',
        }, { order: 'newest' }));

        this.users = this.store.getState().users;
      });

      it('then creates a new collection with the specified key and places the item in it', function() {
        expect(this.users.collections['order=newest'].positions).toEqual([ 1 ]);
        expect(this.users.collections['active=true'].positions).toEqual([]);
      });
    });

    describe('and there are collections with keys that exactly match', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            items: {},
            collections: {
              'active=true': {
                positions: [ ],
                status: { type: null }
              },
              'order=newest': {
                positions: [ ],
                status: { type: null }
              },
            },
            newItemKey: null
          }
        }, { users: this.reducers } );

        this.store.dispatch(this.newUser(1, {
          username: 'Jill',
        }, { order: 'newest' }));

        this.users = this.store.getState().users;
      });

      it('then adds the new item to the matching collections', function() {
        expect(this.users.collections['active=true'].positions).toEqual([]);
        expect(this.users.collections['order=newest'].positions).toEqual([ 1 ]);
      });
    });
  });
});
