import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, ERROR, FETCHING, SUCCESS } from '../../../index';

describe('Index reducers:', function () {
  beforeAll(function() {
    const { reducers, fetchUsers } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
    }, {
      index: true
    });

    this.fetchUsers = fetchUsers;
    this.reducers = reducers;
  });

  describe('when no actions have come before it', function () {
    beforeAll(function () {
      this.resourceBefore = {
        items: {},
        collections: {}
      };
    });

    [
      {
        description: 'and no params are used',
        url: 'http://test.com/users',
        // eslint-disable-next-line no-undefined
        params: undefined,
        collectionId: '',
      },
      {
        description: 'and params are used',
        url: 'http://test.com/users/newest',
        params: 'newest',
        collectionId: 'newest',
      }
    ].forEach(({ description, url, params, collectionId }) => {

      describe(description, function () {
        describe('and the API request succeeds', function() {
          beforeAll(function () {
            this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

            fetchMock.get(url, {
              body: [{ id: 1, username: 'Bob' }],
            }, new Promise((resolve) => {
              this.resolveRequest = resolve;
            }));

            this.store.dispatch(params ? this.fetchUsers(params) : this.fetchUsers());

            this.users = this.store.getState().users;
          });

          afterAll(function() {
            fetchMock.restore();
          });

          describe('before the request has completed', function () {
            it('then adds a default collection with a status type of fetching', function() {
              expect(this.users.collections[collectionId].status.type).toEqual(FETCHING);
            });

            it('then adds a default collection with an empty list of positions', function() {
              expect(this.users.collections[collectionId].positions).toEqual([]);
            });
          });

          describe('and the request has completed', function () {
            beforeAll(function () {
              this.resolveRequest();

              this.users = this.store.getState().users;
            });

            it('then changes the collection\'s status type to SUCCESS', function() {
              expect(this.users.collections[collectionId].status.type).toEqual(SUCCESS);
            });

            it('then indexes the returned items according to the keyBy option and places their keys in positions', function() {
              expect(this.users.collections[collectionId].positions).toEqual([ 1 ]);
            });

            it('then adds the returned items to the resource and keys them according to the keyBy option', function() {
              expect(this.users.items[1].values).toEqual({
                id: 1,
                username: 'Bob'
              });
            });

            it('then sets the items status to SUCCESS', function() {
              expect(this.users.items[1].status.type).toEqual(SUCCESS);
            });
          });
        });

        describe('and the API request errors', function() {
          beforeAll(function () {
            this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

            fetchMock.get(url, {
              body: { error: 'Not Found' },
              status: 404
            }, new Promise((resolve) => {
              this.resolveRequest = resolve;
            }));

            this.store.dispatch(params ? this.fetchUsers(params) : this.fetchUsers());

            this.users = this.store.getState().users;
          });

          afterAll(function() {
            fetchMock.restore();
          });

          describe('before the request has completed', function () {
            it('then adds a default collection with a status type of fetching', function() {
              expect(this.users.collections[collectionId].status.type).toEqual(FETCHING);
            });

            it('then adds a default collection with an empty list of positions', function() {
              expect(this.users.collections[collectionId].positions).toEqual([]);
            });
          });

          describe('and the request has completed', function () {
            beforeAll(function () {
              this.resolveRequest();

              this.users = this.store.getState().users;
            });

            it('then changes the collection\'s status', function() {
              expect(this.users.collections[collectionId].status).toEqual({
                type: ERROR,
                httpCode: 404,
                error: 'Not Found'
              });
            });

            it('then does not change the positions', function() {
              expect(this.users.collections[collectionId].positions).toEqual([ ]);
            });

            it('then does not add any items', function() {
              expect(this.users.items).toEqual({});
            });
          });
        });
      });
    });

  });

  describe('when an INDEX action has come before it', function() {
    beforeAll(function () {
      this.resourceBefore = {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        },
        collections: {
          '': {
            positions: [ 1 ],
            status: { type: SUCCESS }
          }
        }
      };
    });

    describe('and the API request succeeds', function() {
      beforeAll(function () {
        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        fetchMock.get('http://test.com/users', {
          body: [
            { id: 2, username: 'Jane' }
          ],
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.fetchUsers());

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then sets the collection\'s status to fetching', function() {
          expect(this.users.collections[''].status.type).toEqual(FETCHING);
        });

        it('then does NOT clear the collection\'s positions', function() {
          expect(this.users.collections[''].positions).toEqual([ 1 ]);
        });

        it('then does NOT clear the collection\'s items', function() {
          expect(this.users.items).toEqual({
            1: {
              values: {
                id: 1,
                username: 'Bob'
              },
              status: { type: SUCCESS }
            }
          });
        });
      });

      describe('and the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the collection\'s status type to SUCCESS', function() {
          expect(this.users.collections[''].status.type).toEqual(SUCCESS);
        });

        it('then adds the returned items keys to the end of positions', function() {
          expect(this.users.collections[''].positions).toEqual([ 1, 2 ]);
        });

        it('then adds items returned in the response not already in the store', function() {
          expect(this.users.items[2].values).toEqual({ id: 2, username: 'Jane' });
        });

        it('then sets the items status to SUCCESS', function() {
          expect(this.users.items[1].status.type).toEqual(SUCCESS);
        });
      });
    });

    describe('and the API request errors', function() {
      beforeAll(function () {
        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        fetchMock.get('http://test.com/users', {
          body: { error: 'Not Found' },
          status: 404
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.fetchUsers());

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then sets the collection\'s status to fetching', function() {
          expect(this.users.collections[''].status.type).toEqual(FETCHING);
        });

        it('then does NOT clear the collection\'s positions', function() {
          expect(this.users.collections[''].positions).toEqual([ 1 ]);
        });

        it('then does NOT clear the collection\'s items', function() {
          expect(this.users.items).toEqual({
            1: {
              values: {
                id: 1,
                username: 'Bob'
              },
              status: { type: SUCCESS }
            }
          });
        });
      });

      describe('and the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the collection\'s status to ERROR', function() {
          expect(this.users.collections[''].status).toEqual({
            type: ERROR,
            httpCode: 404,
            error: 'Not Found'
          });
        });

        it('then does NOT change the collection\'s positions', function() {
          expect(this.users.collections[''].positions).toEqual([ 1 ]);
        });

        it('then does NOT update any of the items', function() {
          expect(this.users.items).toEqual({
            1: {
              values: {
                id: 1,
                username: 'Bob'
              },
              status: { type: SUCCESS }
            }
          });
        });
      });
    });

  });

  describe('when a SHOW action has come before it', function () {
    beforeAll(function () {
      this.resourceBefore = {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        },
        collections: {}
      };
    });

    describe('and the API request succeeds', function() {
      beforeAll(function () {
        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        fetchMock.get('http://test.com/users', {
          body: [
            { id: 1, username: 'Robert' },
            { id: 2, username: 'Jane' }
          ],
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.fetchUsers());

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then does NOT clear the collection\'s items', function() {
          expect(this.users.items).toEqual({
            1: {
              values: {
                id: 1,
                username: 'Bob'
              },
              status: { type: SUCCESS }
            }
          });
        });
      });

      describe('and the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then updates any items fetched using SHOW that are in the response', function() {
          expect(this.users.items[1]).toEqual({
            values: { id: 1, username: 'Robert' },
            status: { type: SUCCESS }
          });
        });

        it('then adds any new items in the response that were not already in the store', function() {
          expect(this.users.items[2]).toEqual({
            values: { id: 2, username: 'Jane' },
            status: { type: SUCCESS }
          });
        });
      });
    });

    describe('and the API request errors', function() {
      beforeAll(function () {
        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        fetchMock.get('http://test.com/users', {
          body: { error: 'Not Found' },
          status: 404
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.fetchUsers());

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then does NOT clear the collection\'s items', function() {
          expect(this.users.items).toEqual({
            1: {
              values: {
                id: 1,
                username: 'Bob'
              },
              status: { type: SUCCESS }
            }
          });
        });
      });

      describe('and the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then does NOT update any items', function() {
          expect(this.users.items[1]).toEqual({
            values: { id: 1, username: 'Bob' },
            status: { type: SUCCESS }
          });
        });
      });
    });
  });
});
