import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, RESOURCES, CREATING, ERROR, NEW, SUCCESS } from '../../../index';

describe('Create reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { createUser } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id'
    }, {
      create: true
    });

    this.createUser = createUser;
    this.reducers = reducers;
  });

  [
    {
      description: 'Given no actions have come before it',
      initialState: { users: { ...RESOURCES } }
    },
    {
      description: 'Given a NEW action has come before it',
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
      [
        {
          idArgsDescription: 'and only the item\'s id is passed to the action creator,',
          idArgs: 'temp'
        },
        {
          idArgsDescription: 'and the item\'s id is passed as an object to the action creator,',
          idArgs: { id: 'temp' }
        }
      ].forEach(({ idArgsDescription, idArgs }) => {
        describe(idArgsDescription, function() {
          describe('and the API request succeeds,', function () {
            describe('before the request has completed,', function () {
              beforeAll(function () {
                fetchMock.post('http://test.com/users', new Promise(resolve => {}));

                this.store = buildStore(initialState, { users: this.reducers } );

                this.store.dispatch(this.createUser(idArgs, {
                  username: 'Bob'
                }));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then adds a new item with the correct values', function() {
                expect(this.store.getState().users.items.temp.values).toEqual({ username: 'Bob' });
              });

              it('then adds a new item with a status type of CREATING', function() {
                expect(this.store.getState().users.items.temp.status.type).toEqual(CREATING);
              });

              it('then does NOT add the temporary key to the default collection', function() {
                expect(this.store.getState().users.collections).toEqual({});
              });

              it('then sets the newItemKey to the temporary key', function() {
                expect(this.store.getState().users.newItemKey).toEqual('temp');
              });
            });

            describe('when the request has completed,', () => {
              beforeAll(function () {
                fetchMock.post('http://test.com/users', {
                  body: { id: 1, username: 'Bob' },
                });

                this.store = buildStore(initialState, { users: this.reducers } );

                this.store.dispatch(this.createUser(idArgs, {
                  username: 'Bob'
                }));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then moves the item to the new ID and merges in values from the server', function() {
                expect(this.store.getState().users.items[1].values).toEqual({
                  id: 1,
                  username: 'Bob',
                });
              });

              it('then sets the items status type to SUCCESS', function() {
                expect(this.store.getState().users.items[1].status.type).toEqual(SUCCESS);
              });

              it('then updates the newItemKey ', function() {
                expect(this.store.getState().users.newItemKey).toEqual(1);
              });
            });
          });

          describe('and the API request errors', function () {
            describe('before the request has completed', function () {
              beforeAll(function () {
                fetchMock.post('http://test.com/users', new Promise(resolve => {}));

                this.store = buildStore(initialState, { users: this.reducers } );

                this.store.dispatch(this.createUser(idArgs, {
                  username: 'Bob'
                }));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then adds a new item with the correct values', function() {
                expect(this.store.getState().users.items.temp.values).toEqual({ username: 'Bob' });
              });

              it('then adds a new item with a status type of CREATING', function() {
                expect(this.store.getState().users.items.temp.status.type).toEqual(CREATING);
              });

              it('then does NOT add the temporary key to the default collection', function() {
                expect(this.store.getState().users.collections).toEqual({});
              });

              it('then sets the newItemKey to the temporary key', function() {
                expect(this.store.getState().users.newItemKey).toEqual('temp');
              });
            });

            describe('when the request has completed', () => {
              beforeAll(function () {
                fetchMock.post('http://test.com/users', {
                  body: { error: 'Not Found' },
                  status: 404
                });

                this.store = buildStore(initialState, { users: this.reducers } );

                this.store.dispatch(this.createUser(idArgs, {
                  username: 'Bob'
                }));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then DOES NOT move the item from its temporary key', function() {
                expect(this.store.getState().users.items.temp.values).toEqual({
                  username: 'Bob',
                });
              });

              it('then sets the items status type to ERROR', function() {
                expect(this.store.getState().users.items.temp.status.type).toEqual(ERROR);
              });

              it('then sets the items status httpCode', function() {
                expect(this.store.getState().users.items.temp.status.httpCode).toEqual(404);
              });

              it('then merges in the server\'s response into the status', function() {
                expect(this.store.getState().users.items.temp.status.error.message).toEqual('Not Found');
              });

              it('then DOES NOT update the newItemKey', function() {
                expect(this.store.getState().users.newItemKey).toEqual('temp');
              });
            });
          });
        });
      });
    });
  });

  describe('when there is already an item in the store with the same key', function () {
    describe('before the request has completed', function () {
      beforeAll(function(){
        fetchMock.post('http://test.com/users', new Promise(resolve => {}));

        spyOn(console, 'warn');

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

        this.store.dispatch(this.createUser(1, {
          username: 'Bob'
        }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then warns about the collision', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith('Redux and the REST: CREATE_USER has the same key \'1\' as an existing item. Use update*() to update an existing item, or ensure the new item has a unique temporary key. (The create request was still sent to the server.)');
      });

      it('then adds replaces the existing item\'s values', function() {
        expect(this.store.getState().users.items[1].values).toEqual({ username: 'Bob' });
      });

      it('then sets the status of the existing item to CREATING', function() {
        expect(this.store.getState().users.items[1].status.type).toEqual(CREATING);
      });

      it('then sets the newItemKey to the temporary key', function() {
        expect(this.store.getState().users.newItemKey).toEqual(1);
      });
    });

    describe('when the request has completed', () => {
      beforeAll(function () {
        fetchMock.post('http://test.com/users', {
          body: { id: 2, username: 'Bob' },
        });

        /**
         * Spy isn't actually used - just prevents warning from showing in test output
         */
        spyOn(console, 'warn');

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

        this.store.dispatch(this.createUser(1, {
          username: 'Bob'
        }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then moves the item to the new ID and merges in values from the server', function() {
        expect(this.store.getState().users.items[2].values).toEqual({
          id: 2,
          username: 'Bob',
        });
      });

      it('then sets the items status type to SUCCESS', function() {
        expect(this.store.getState().users.items[2].status.type).toEqual(SUCCESS);
      });

      it('then updates the newItemKey ', function() {
        expect(this.store.getState().users.newItemKey).toEqual(2);
      });
    });
  });

  [
    {
      operator: 'push',
      expectedIsolatedStateBefore: ['temp'],
      expectedIsolatedStateAfter: [2],
      expectedCumulativeStateBefore: [1, 'temp'],
      expectedCumulativeStateAfter: [1, 2]
    },
    {
      operator: 'unshift',
      expectedIsolatedStateBefore: ['temp'],
      expectedIsolatedStateAfter: [2],
      expectedCumulativeStateBefore: ['temp', 1],
      expectedCumulativeStateAfter: [2, 1]
    },
    {
      operator: 'invalidate',
      expectedIsolatedStateBefore: [],
      expectedIsolatedStateAfter: [],
      expectedCumulativeStateBefore: [],
      expectedCumulativeStateAfter: []
    },
  ].forEach(({ operator, expectedIsolatedStateBefore, expectedIsolatedStateAfter, expectedCumulativeStateBefore, expectedCumulativeStateAfter }) => {
    describe(`when the ${operator} collections operator is used`, () => {
      describe('and there are NO collections', function () {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.post('http://test.com/users', new Promise(resolve => {}));

            this.store = buildStore({
              users: {
                items: {},
                collections: {},
                newItemKey: null
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }, { [operator]: { order: 'newest' } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then creates a new collection with the specified temp key and places the item in it', function() {
            expect(this.store.getState().users.collections).toEqual({
              'order=newest': {
                positions: expectedIsolatedStateBefore,
                status: { type: null },
                projection: { type: null }
              }
            });
          });
        });

        describe('when the request has completed', () => {
          beforeAll(function () {
            fetchMock.post('http://test.com/users', {
              body: { id: 2, username: 'Bob' },
            });

            this.store = buildStore({
              users: {
                items: {},
                collections: {},
                newItemKey: null
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }, { [operator]: { order: 'newest' } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then replaces all references to the temporary key with the new item key', function() {
            expect(this.store.getState().users.collections).toEqual({
              'order=newest': {
                positions: expectedIsolatedStateAfter,
                status: { type: null },
                projection: { type: null }
              }
            });
          });
        });
      });

      describe('and there are NO MATCHING collections', function () {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.post('http://test.com/users', new Promise(resolve => {}));

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

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }, { [operator]: { order: 'newest' } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then creates a new collection with the specified temp key and places the item in it', function() {
            const userStatus = this.store.getState().users;

            expect(userStatus.collections['order=newest'].positions).toEqual(expectedIsolatedStateBefore);
            expect(userStatus.collections['active=true'].positions).toEqual([]);
          });
        });

        describe('when the request has completed', () => {
          beforeAll(function () {
            fetchMock.post('http://test.com/users', {
              body: { id: 2, username: 'Bob' },
            });

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

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }, { [operator]: { order: 'newest' } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then replaces all references to the temporary key with the new item key', function() {
            expect(this.store.getState().users.collections['order=newest'].positions).toEqual(expectedIsolatedStateAfter);
          });
        });
      });

      describe('and there are collections with keys that exactly match', function () {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.post('http://test.com/users', new Promise(resolve => {}));

            this.store = buildStore({
              users: {
                items: {
                  1: { id: 1, username: 'Jane' }
                },
                collections: {
                  'active=true': {
                    positions: [ ],
                    status: { type: null }
                  },
                  'order=newest': {
                    positions: [ 1 ],
                    status: { type: null }
                  },
                },
                newItemKey: null
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }, { [operator]: { order: 'newest' } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then adds the new item\'s temp key to the matching collections', function() {
            const users = this.store.getState().users;

            expect(users.collections['active=true'].positions).toEqual([]);
            expect(users.collections['order=newest'].positions).toEqual(expectedCumulativeStateBefore);
          });
        });

        describe('when the request has completed', () => {
          beforeAll(function () {
            fetchMock.post('http://test.com/users', {
              body: { id: 2, username: 'Bob' },
            });

            this.store = buildStore({
              users: {
                items: {
                  1: { id: 1, username: 'Jane' }
                },
                collections: {
                  'active=true': {
                    positions: [ ],
                    status: { type: null }
                  },
                  'order=newest': {
                    positions: [ 1 ],
                    status: { type: null }
                  },
                },
                newItemKey: null
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }, { [operator]: { order: 'newest' } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then replaces all references to the temporary key with the new item key', function() {
            expect(this.store.getState().users.collections['order=newest'].positions).toEqual(expectedCumulativeStateAfter);
          });
        });
      });
    });
  });
});
