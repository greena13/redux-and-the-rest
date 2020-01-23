import fetchMock from 'fetch-mock';

import { resources, RESOURCES, DESTROY_ERROR, ERROR, SUCCESS } from '../../index';
import buildStore from '../helpers/buildStore';

describe('Specifying a response adaptor:', function () {
  describe('Specifying a response adaptor for all actions', function () {
    beforeAll(function() {
      const {
        reducers,
        createUser,
        fetchUsers,
        fetchUser,
        updateUser,
        destroyUser

      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        responseAdaptor: (body) => {
          return { values: body.response, error: body.error };
        }
      }, {
        index: true,
        show: true,
        update: true,
        destroy: true,
        create: true
      });

      this.reducers = reducers;

      this.createUser = createUser;
      this.fetchUsers = fetchUsers;
      this.fetchUser = fetchUser;
      this.updateUser = updateUser;
      this.destroyUser = destroyUser;
    });

    describe('when the index request', function () {
      describe('succeeds', () => {
        beforeAll(function () {
          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

          fetchMock.get('http://test.com/users', {
            body: {
              status: 200,
              response: [ { id: 1, username: 'Bob' } ]
            },
            status: 200
          });
        });

        afterAll(function () {
          fetchMock.restore();
        });

        it('then uses the response adaptor', function() {
          this.store.dispatch(this.fetchUsers());
        });
      });

      describe('errors', () => {
        describe('with a JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            fetchMock.get('http://test.com/users', {
              body: {
                status: 404,
                error: 'NOT_FOUND'
              },
              status: 404
            });
          });

          afterAll(function () {
            fetchMock.restore();
          });

          it('then uses the response adaptor', function() {
            return this.store.dispatch(this.fetchUsers()).then(() => {
              const collection = this.store.getState().users.collections[''];

              expect(collection.status.type).toEqual(ERROR);
              expect(collection.status.error.message).toEqual('NOT_FOUND');
              expect(collection.status.httpCode).toEqual(404);
            });
          });

        });

        describe('with a non-JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            fetchMock.get('http://test.com/users', {
              body: 'Long error stack trace',
              headers: {
                'Content-Type': 'text/html'
              },
              status: 500
            });
          });

          afterAll(function () {
            fetchMock.restore();
          });

          it('then does not use the response adaptor', function() {
            return this.store.dispatch(this.fetchUsers()).then(() => {
              const collection = this.store.getState().users.collections[''];

              expect(collection.status.type).toEqual(ERROR);
              expect(collection.status.error.message).toEqual('Long error stack trace');
              expect(collection.status.httpCode).toEqual(500);
            });
          });

        });
      });
    });

    describe('when the show request', function () {
      describe('succeeds', function () {
        beforeAll(function () {
          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

          fetchMock.get('http://test.com/users/1', {
            body: {
              status: 200,
              response: { id: 1, username: 'Bob' }
            },
            status: 200
          });
        });

        afterAll(function() {
          fetchMock.restore();
        });

        it('then uses the response adaptor', function() {
          return this.store.dispatch(this.fetchUser(1)).then(() => {
            const item = this.store.getState().users.items[1];

            expect(item.status.type).toEqual(SUCCESS);
            expect(item.values).toEqual({ id: 1, username: 'Bob' });
          });
        });
      });

      describe('errors', function () {
        describe('with a JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            fetchMock.get('http://test.com/users/1', {
              body: {
                status: 404,
                error: 'NOT_FOUND'
              },
              status: 404
            });
          });

          afterAll(function() {
            fetchMock.restore();
          });

          it('then uses the response adaptor', function() {
            return this.store.dispatch(this.fetchUser(1)).then(() => {
              const item = this.store.getState().users.items[1];

              expect(item.status.type).toEqual(ERROR);
              expect(item.status.error.message).toEqual('NOT_FOUND');

              expect(item.values).toEqual({ });
            });
          });
        });

        describe('with a non-JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            fetchMock.get('http://test.com/users/1', {
              body: 'Long error stack trace',
              headers: {
                'Content-Type': 'text/html'
              },
              status: 500
            });
          });

          afterAll(function () {
            fetchMock.restore();
          });

          it('then does not use the response adaptor', function() {
            return this.store.dispatch(this.fetchUser(1)).then(() => {
              const collection = this.store.getState().users.items[1];

              expect(collection.status.type).toEqual(ERROR);
              expect(collection.status.error.message).toEqual('Long error stack trace');
              expect(collection.status.httpCode).toEqual(500);
            });
          });

        });
      });
    });

    describe('when a create request', function () {
      describe('succeeds', function () {
        beforeAll(function () {
          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

          fetchMock.post('http://test.com/users', {
            body: {
              status: 200,
              response: { id: 1, username: 'Bob' }
            },
            status: 200
          });
        });

        afterAll(function() {
          fetchMock.restore();
        });

        it('then uses the response adaptor', function() {
          return this.store.dispatch(this.createUser('temp', { username: 'Bob' })).then(() => {
            const item = this.store.getState().users.items[1];

            expect(item.status.type).toEqual(SUCCESS);
            expect(item.values).toEqual({ id: 1, username: 'Bob' });
          });
        });
      });

      describe('errors', () => {
        describe('with a JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            fetchMock.post('http://test.com/users', {
              body: {
                status: 404,
                error: 'NOT_FOUND'
              },
              status: 404
            });
          });

          afterAll(function() {
            fetchMock.restore();
          });

          it('then uses the response adaptor', function() {
            return this.store.dispatch(this.createUser('temp', { username: 'Bob' })).then(() => {

              const item = this.store.getState().users.items.temp;

              expect(item.status.type).toEqual(ERROR);
              expect(item.status.error.message).toEqual('NOT_FOUND');
              expect(item.values).toEqual({ username: 'Bob' });
            });
          });
        });

        describe('with a non-JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            fetchMock.post('http://test.com/users', {
              body: 'Long error stack trace',
              headers: {
                'Content-Type': 'text/html'
              },
              status: 500
            });
          });

          afterAll(function () {
            fetchMock.restore();
          });

          it('then does not use the response adaptor', function() {
            return this.store.dispatch(this.createUser('temp', { username: 'Bob' })).then(() => {
              const item = this.store.getState().users.items.temp;

              expect(item.status.type).toEqual(ERROR);
              expect(item.status.error.message).toEqual('Long error stack trace');
              expect(item.status.httpCode).toEqual(500);
            });
          });
        });
      });
    });

    describe('when an update request', function () {
      describe('succeeds', function () {
        beforeAll(function () {
          this.store = buildStore({
            users: {
              ...RESOURCES,
              items: {
                1: {
                  values: {
                    id: 1,
                    username: 'Bob'
                  },
                  status: { type: SUCCESS }
                }
              }
            }
          }, { users: this.reducers } );

          fetchMock.put('http://test.com/users/1', {
            body: {
              status: 200,
              response: { id: 1, username: 'Robert' }
            },
            status: 200
          });
        });

        afterAll(function() {
          fetchMock.restore();
        });

        it('then uses the response adaptor', function() {
          return this.store.dispatch(this.updateUser(1, { username: 'Robert' })).then(() => {
            const item = this.store.getState().users.items[1];

            expect(item.status.type).toEqual(SUCCESS);
            expect(item.values).toEqual({ id: 1, username: 'Robert' });
          });
        });
      });

      describe('errors', function () {
        describe('with a JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({
              users: {
                ...RESOURCES,
                items: {
                  1: {
                    values: {
                      id: 1,
                      username: 'Bob'
                    },
                    status: { type: SUCCESS }
                  }
                }
              }
            }, { users: this.reducers } );

            fetchMock.put('http://test.com/users/1', {
              body: {
                status: 404,
                error: 'NOT_FOUND'
              },
              status: 404
            });
          });

          afterAll(function() {
            fetchMock.restore();
          });

          it('then uses the response adaptor', function() {
            return this.store.dispatch(this.updateUser(1, { username: 'Robert' })).then(() => {

              const item = this.store.getState().users.items[1];

              expect(item.status.type).toEqual(ERROR);
              expect(item.status.error.message).toEqual('NOT_FOUND');
              expect(item.values).toEqual({ id: 1, username: 'Robert' });
            });
          });
        });

        describe('with a non-JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({
              users: {
                ...RESOURCES,
                items: {
                  1: {
                    values: {
                      id: 1,
                      username: 'Bob'
                    },
                    status: { type: SUCCESS }
                  }
                }
              }
            }, { users: this.reducers } );

            fetchMock.put('http://test.com/users/1', {
              body: 'Long error stack trace',
              headers: {
                'Content-Type': 'text/html'
              },
              status: 500
            });
          });

          afterAll(function () {
            fetchMock.restore();
          });

          it('then does not use the response adaptor', function() {
            return this.store.dispatch(this.updateUser(1, { username: 'Robert' })).then(() => {
              const item = this.store.getState().users.items[1];

              expect(item.status.type).toEqual(ERROR);
              expect(item.status.error.message).toEqual('Long error stack trace');
              expect(item.status.httpCode).toEqual(500);
            });
          });
        });
      });
    });

    describe('when a destroy action', function () {
      describe('succeeds', function () {
        beforeAll(function () {
          this.store = buildStore({
            users: {
              ...RESOURCES,
              items: {
                1: {
                  values: {
                    id: 1,
                    username: 'Bob'
                  },
                  status: { type: SUCCESS }
                }
              }
            }
          }, { users: this.reducers } );

          fetchMock.delete('http://test.com/users/1', {
            body: {
              status: 200,
              response: { }
            },
            status: 200
          });
        });

        afterAll(function() {
          fetchMock.restore();
        });

        it('then uses the response adaptor', function() {
          return this.store.dispatch(this.destroyUser(1)).then(() => {
            const item = this.store.getState().users.items[1];

            expect(item).toEqual(undefined);
          });
        });
      });

      describe('errors', function () {
        describe('with a JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({
              users: {
                ...RESOURCES,
                items: {
                  1: {
                    values: {
                      id: 1,
                      username: 'Bob'
                    },
                    status: { type: SUCCESS }
                  }
                }
              }
            }, { users: this.reducers } );

            fetchMock.delete('http://test.com/users/1', {
              body: {
                status: 404,
                error: 'NOT_FOUND'
              },
              status: 404
            });
          });

          afterAll(function() {
            fetchMock.restore();
          });

          it('then uses the response adaptor', function() {
            return this.store.dispatch(this.destroyUser(1)).then(() => {

              const item = this.store.getState().users.items[1];

              expect(item.status.type).toEqual(DESTROY_ERROR);
              expect(item.status.error.message).toEqual('NOT_FOUND');
              expect(item.values).toEqual({ id: 1, username: 'Bob' });
            });
          });
        });

        describe('with a non-JSON response', function () {
          beforeAll(function () {
            this.store = buildStore({
              users: {
                ...RESOURCES,
                items: {
                  1: {
                    values: {
                      id: 1,
                      username: 'Bob'
                    },
                    status: { type: SUCCESS }
                  }
                }
              }
            }, { users: this.reducers } );

            fetchMock.delete('http://test.com/users/1', {
              body: 'Long error stack trace',
              headers: {
                'Content-Type': 'text/html'
              },
              status: 500
            });
          });

          afterAll(function () {
            fetchMock.restore();
          });

          it('then does not use the response adaptor', function() {
            return this.store.dispatch(this.destroyUser(1)).then(() => {
              const item = this.store.getState().users.items[1];

              expect(item.status.type).toEqual(DESTROY_ERROR);
              expect(item.status.error.message).toEqual('Long error stack trace');
              expect(item.status.httpCode).toEqual(500);
            });
          });
        });
      });

    });

  });

  describe('when the default is overridden for a particular action', function () {
    beforeAll(function() {
      const {
        reducers,
        fetchUsers,
        fetchUser,

      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        responseAdaptor: (body) => {
          return { values: body.response, error: body.error };
        }
      }, {
        index: {
          responseAdaptor: (body) => {
            return { values: body.items, error: body.error };
          }
        },
        show: true,
      });

      this.fetchUsers = fetchUsers;
      this.fetchUser = fetchUser;

      this.store = buildStore({
        users: RESOURCES
      }, { users: reducers } );
    });

    it('then uses the response adaptor for that action', function() {
      fetchMock.get('http://test.com/users', {
        body: {
          status: 200,
          items: [ { id: 1, username: 'Bob' } ]
        },
        status: 200
      });

      this.store.dispatch(this.fetchUsers());

      fetchMock.restore();
    });

    it('then uses the default response adaptor for other actions', function() {
      fetchMock.get('http://test.com/users/1', {
        body: { id: 1, username: 'Bob' },
        status: 200
      });

      this.store.dispatch(this.fetchUser(1));

      fetchMock.restore();
    });
  });

});
