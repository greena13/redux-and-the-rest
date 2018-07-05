import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, RESOURCES, CREATING, ERROR, NEW, SUCCESS } from '../../../index';

describe('Create reducer:', function () {
  beforeAll(function() {
    const { reducers, createUser } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
    }, {
      create: true
    });

    this.createUser = createUser;
    this.reducers = reducers;
  });

  [
    {
      description: 'when no actions have come before it',
      initialState: { users: { ...RESOURCES } }
    },
    {
      description: 'when a NEW action has come before it',
      initialState: {
        users: {
          items: {
            temp: {
              values: { username: 'Robert' },
              status: { type: NEW }
            }
          },
          collections: { },
          newItemKey: 'temp'
        }
      }
    }
  ].forEach(({ description, initialState }) => {
    describe(description, function () {

      describe('and the API request succeeds', function () {
        beforeAll(function () {
          this.store = buildStore(initialState, { users: this.reducers } );

          fetchMock.post('http://test.com/users', {
            body: { id: 1, username: 'Bob' },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          this.store.dispatch(this.createUser('temp', {
            username: 'Bob'
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then adds a new item with the correct values', function() {
            expect(this.users.items.temp.values).toEqual({ username: 'Bob' });
          });

          it('then adds a new item with a status type of CREATING', function() {
            expect(this.users.items.temp.status.type).toEqual(CREATING);
          });

          it('then does NOT add the temporary key to the default collection', function() {
            expect(this.users.collections).toEqual({});
          });

          it('then sets the newItemKey to the temporary key', function() {
            expect(this.users.newItemKey).toEqual('temp');
          });
        });

        describe('when the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then moves the item to the new ID and merges in values from the server', function() {
            expect(this.users.items[1].values).toEqual({
              id: 1,
              username: 'Bob',
            });
          });

          it('then sets the items status type to SUCCESS', function() {
            expect(this.users.items[1].status.type).toEqual(SUCCESS);
          });

          it('then updates the newItemKey ', function() {
            expect(this.users.newItemKey).toEqual(1);
          });

        });

      });

      describe('and the API request errors', function () {
        beforeAll(function () {
          this.store = buildStore(initialState, { users: this.reducers } );

          fetchMock.post('http://test.com/users', {
            body: { error: 'Not Found' },
            status: 404
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          this.store.dispatch(this.createUser('temp', {
            username: 'Bob'
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then adds a new item with the correct values', function() {
            expect(this.users.items.temp.values).toEqual({ username: 'Bob' });
          });

          it('then adds a new item with a status type of CREATING', function() {
            expect(this.users.items.temp.status.type).toEqual(CREATING);
          });

          it('then does NOT add the temporary key to the default collection', function() {
            expect(this.users.collections).toEqual({});
          });

          it('then sets the newItemKey to the temporary key', function() {
            expect(this.users.newItemKey).toEqual('temp');
          });
        });

        describe('when the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then DOES NOT move the item from its temporary key', function() {
            expect(this.users.items.temp.values).toEqual({
              username: 'Bob',
            });
          });

          it('then sets the items status type to ERROR', function() {
            expect(this.users.items.temp.status.type).toEqual(ERROR);
          });

          it('then sets the items status httpCode', function() {
            expect(this.users.items.temp.status.httpCode).toEqual(404);
          });

          it('then merges in the server\'s response into the status', function() {
            expect(this.users.items.temp.status.error).toEqual('Not Found');
          });

          it('then DOES NOT update the newItemKey', function() {
            expect(this.users.newItemKey).toEqual('temp');
          });
        });
      });

    });
  });

  describe('when there is already an item in the store with the same key', function () {
    beforeAll(function () {
      this.store = buildStore({
        users: {
          items: {
            1: {
              values: { username: 'Robert' },
              status: { type: SUCCESS }
            }
          },
          collections: {
            '': {
              positions: [ 1 ],
              status: { type: null }
            }
          },
          newItemKey: null
        }
      }, { users: this.reducers } );

      fetchMock.post('http://test.com/users', {
        body: { id: 2, username: 'Bob' },
      }, new Promise((resolve) => {
        this.resolveRequest = resolve;
      }));

      spyOn(console, 'warn');

      this.store.dispatch(this.createUser(1, {
        username: 'Bob'
      }));

      this.users = this.store.getState().users;
    });

    afterAll(function() {
      fetchMock.restore();
    });

    describe('before the request has completed', function () {
      it('then warns about the collision', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith('Redux and the REST: CREATE_USER has the same key \'1\' as an existing item. Use update*() to update an existing item, or ensure the new item has a unique temporary key. (The create request was still sent to the server.)');
      });

      it('then adds replaces the existing item\'s values', function() {
        expect(this.users.items[1].values).toEqual({ username: 'Bob' });
      });

      it('then sets the status of the existing item to CREATING', function() {
        expect(this.users.items[1].status.type).toEqual(CREATING);
      });

      it('then sets the newItemKey to the temporary key', function() {
        expect(this.users.newItemKey).toEqual(1);
      });
    });

    describe('when the request has completed', () => {
      beforeAll(function () {
        this.resolveRequest();

        this.users = this.store.getState().users;
      });

      it('then moves the item to the new ID and merges in values from the server', function() {
        expect(this.users.items[2].values).toEqual({
          id: 2,
          username: 'Bob',
        });
      });

      it('then sets the items status type to SUCCESS', function() {
        expect(this.users.items[2].status.type).toEqual(SUCCESS);
      });

      it('then updates the newItemKey ', function() {
        expect(this.users.newItemKey).toEqual(2);
      });
    });
  });

  describe('when the collectionKeys attribute is used', () => {
    beforeAll(function () {
      fetchMock.post('http://test.com/users', {
        body: { id: 2, username: 'Bob' },
      });

    });

    afterAll(function() {
      fetchMock.restore();
    });

    describe('and there are NO collections', function () {
      beforeAll(function () {
        this.store = buildStore({
          users: {
            items: {},
            collections: {},
            newItemKey: null
          }
        }, { users: this.reducers } );

        this.store.dispatch(this.createUser(1, {
          username: 'Bob'
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

        this.store.dispatch(this.createUser(1, {
          username: 'Bob'
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

        this.store.dispatch(this.createUser(1, {
          username: 'Bob'
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
