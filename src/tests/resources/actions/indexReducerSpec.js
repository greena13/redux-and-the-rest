import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, ERROR, FETCHING, SUCCESS } from '../../../index';
import nop from '../../../utils/function/nop';

describe('Index reducers:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { fetchUsers } } = resources({
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
          describe('before the request has completed', function () {
            beforeAll(function () {
              fetchMock.get(url, new Promise(nop));

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );
              this.store.dispatch(params ? this.fetchUsers(params) : this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then adds a default collection with a status type of fetching', function() {
              expect(this.store.getState().users.collections[collectionId].status.type).toEqual(FETCHING);
            });

            it('then adds a default collection with an empty list of positions', function() {
              expect(this.store.getState().users.collections[collectionId].positions).toEqual([]);
            });
          });

          describe('and the request has completed', function () {
            beforeAll(function () {
              fetchMock.get(url, {
                body: [{ id: 1, username: 'Bob' }],
              });

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );
              this.store.dispatch(params ? this.fetchUsers(params) : this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then changes the collection\'s status type to SUCCESS', function() {
              expect(this.store.getState().users.collections[collectionId].status.type).toEqual(SUCCESS);
            });

            it('then indexes the returned items according to the keyBy option and places their keys in positions', function() {
              expect(this.store.getState().users.collections[collectionId].positions).toEqual([ 1 ]);
            });

            it('then adds the returned items to the resource and keys them according to the keyBy option', function() {
              expect(this.store.getState().users.items['1'].values).toEqual({
                id: 1,
                username: 'Bob'
              });
            });

            it('then sets the items status to SUCCESS', function() {
              expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
            });
          });
        });

        describe('and the API request errors', function() {
          describe('before the request has completed', function () {
            beforeAll(function () {
              fetchMock.get(url, new Promise(nop));

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );
              this.store.dispatch(params ? this.fetchUsers(params) : this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then adds a default collection with a status type of fetching', function() {
              expect(this.store.getState().users.collections[collectionId].status.type).toEqual(FETCHING);
            });

            it('then adds a default collection with an empty list of positions', function() {
              expect(this.store.getState().users.collections[collectionId].positions).toEqual([]);
            });
          });

          describe('and the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              fetchMock.get(url, {
                body: { error: 'Not Found' },
                status: 404
              });

              this.store.dispatch(params ? this.fetchUsers(params) : this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then changes the collection\'s status', function() {
              expect(this.store.getState().users.collections[collectionId].status.type).toEqual(ERROR);
              expect(this.store.getState().users.collections[collectionId].status.httpCode).toEqual(404);
              expect(this.store.getState().users.collections[collectionId].status.error.message).toEqual('Not Found');
            });

            it('then sets the syncedAt attribute', function() {
              expect(this.store.getState().users.collections[collectionId].status.errorOccurredAt).not.toBeUndefined();
            });

            it('then does not change the positions', function() {
              expect(this.store.getState().users.collections[collectionId].positions).toEqual([ ]);
            });

            it('then does not add any items', function() {
              expect(this.store.getState().users.items).toEqual({});
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
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.get('http://test.com/users', new Promise(nop));

          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then sets the collection\'s status to fetching', function() {
          expect(this.store.getState().users.collections[''].status.type).toEqual(FETCHING);
        });

        it('then does NOT clear the collection\'s positions', function() {
          expect(this.store.getState().users.collections[''].positions).toEqual([ 1 ]);
        });

        it('then does NOT clear the collection\'s items', function() {
          expect(this.store.getState().users.items).toEqual({
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
          fetchMock.get('http://test.com/users', {
            body: [
              { id: 2, username: 'Jane' }
            ]
          });

          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then changes the collection\'s status type to SUCCESS', function() {
          expect(this.store.getState().users.collections[''].status.type).toEqual(SUCCESS);
        });

        it('then replaces the item keys in the collection\'s positions with the new ones', function() {
          expect(this.store.getState().users.collections[''].positions).toEqual([ 2 ]);
        });

        it('then adds items returned in the response not already in the store', function() {
          expect(this.store.getState().users.items['2'].values).toEqual({ id: 2, username: 'Jane' });
        });

        it('then sets the items status to SUCCESS', function() {
          expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
        });
      });
    });

    describe('and the API request errors', function() {
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.get('http://test.com/users', new Promise(nop));

          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then sets the collection\'s status to fetching', function() {
          expect(this.store.getState().users.collections[''].status.type).toEqual(FETCHING);
        });

        it('then does NOT clear the collection\'s positions', function() {
          expect(this.store.getState().users.collections[''].positions).toEqual([ 1 ]);
        });

        it('then does NOT clear the collection\'s items', function() {
          expect(this.store.getState().users.items).toEqual({
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
          fetchMock.get('http://test.com/users', {
            body: { error: 'Not Found' },
            status: 404
          });

          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then changes the collection\'s status to ERROR', function() {
          expect(this.store.getState().users.collections[''].status.type).toEqual(ERROR);
          expect(this.store.getState().users.collections[''].status.httpCode).toEqual(404);
          expect(this.store.getState().users.collections[''].status.error.message).toEqual('Not Found');
        });

        it('then sets the syncedAt attribute', function() {
          expect(this.store.getState().users.collections[''].status.errorOccurredAt).not.toBeUndefined();
        });

        it('then does NOT change the collection\'s positions', function() {
          expect(this.store.getState().users.collections[''].positions).toEqual([ 1 ]);
        });

        it('then does NOT update any of the items', function() {
          expect(this.store.getState().users.items).toEqual({
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
      describe('before the request has completed', function () {
        beforeAll(function () {
          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          fetchMock.get('http://test.com/users', new Promise(nop));

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then does NOT clear the collection\'s items', function() {
          expect(this.store.getState().users.items).toEqual({
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
          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          fetchMock.get('http://test.com/users', {
            body: [
              { id: 1, username: 'Robert' },
              { id: 2, username: 'Jane' }
            ],
          });

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then updates any items fetched using SHOW that are in the response', function() {
          expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Robert' });
          expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
        });

        it('then adds any new items in the response that were not already in the store', function() {
          expect(this.store.getState().users.items['2'].values).toEqual({ id: 2, username: 'Jane' });
          expect(this.store.getState().users.items['2'].status.type).toEqual(SUCCESS);
        });
      });
    });

    describe('and the API request errors', function() {
      describe('before the request has completed', function () {
        beforeAll(function () {
          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          fetchMock.get('http://test.com/users', new Promise(nop));

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then does NOT clear the collection\'s items', function() {
          expect(this.store.getState().users.items).toEqual({
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
          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          fetchMock.get('http://test.com/users', {
            body: { error: 'Not Found' },
            status: 404
          });

          this.store.dispatch(this.fetchUsers());
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then does NOT update any items', function() {
          expect(this.store.getState().users.items['1']).toEqual({
            values: { id: 1, username: 'Bob' },
            status: { type: SUCCESS }
          });
        });
      });
    });
  });

  describe('Given an index action that will succeed with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      beforeAll(function () {
        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        fetchMock.get('http://test.com/users', {
          body: { errors: ['Not Found'] },
          status: 200
        });

        this.store.dispatch(this.fetchUsers());
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then sets the errors of the collection', function() {
        expect(this.store.getState().users.collections[''].status.error).toEqual('Not Found');
        expect(this.store.getState().users.collections[''].status.errors[0]).toEqual('Not Found');
      });
    });
  });

  describe('Given an index action that will fail with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      beforeAll(function () {
        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        fetchMock.get('http://test.com/users', {
          body: { errors: ['Not Found'] },
          status: 404
        });

        this.store.dispatch(this.fetchUsers());
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then sets the errors of the collection', function() {
        expect(this.store.getState().users.collections[''].status.error).toEqual('Not Found');
        expect(this.store.getState().users.collections[''].status.errors[0]).toEqual('Not Found');
      });
    });
  });
});
