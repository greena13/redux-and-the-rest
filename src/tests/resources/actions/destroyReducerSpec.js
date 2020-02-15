import fetchMock from 'fetch-mock';

import buildStore from '../../helpers/buildStore';
import {
  resources,
  CREATING, DESTROY_ERROR, DESTROYING, EDITING, ERROR, NEW, SUCCESS, UPDATING
} from '../../../index';

describe('Destroy reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { destroyUser } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id'
    }, {
      destroy: true
    });

    this.reducers = reducers;
    this.destroyUser = destroyUser;

    this.resourceBefore = {
      items: {},
      collections: {},
      selectionMap: { },
      newItemKey: null
    };
  });

  describe('when the resource is NOT in the store', function () {
    beforeAll(function () {
      this.initialState = { users: { ...this.resourceBefore, items: {} } };
    });

    describe('and the API request succeeds', function () {
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.delete('http://test.com/users/1', new Promise(resolve => {}));

          spyOn(console, 'warn');

          this.store = buildStore(this.initialState, { users: this.reducers } );
          this.store.dispatch(this.destroyUser(1));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then warns about the missing resource', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: DESTROY_USER\'s key \'1\' did not match any items in the store. (Destroy request was still sent to the server.)'
          );
        });

        it('then creates a new item and sets its status to DESTROYING', function() {
          expect(this.users.items[1].status.type).toEqual(DESTROYING);
        });
      });

      describe('when the request has completed', function() {
        beforeAll(function () {
          fetchMock.delete('http://test.com/users/1', {
            body: {},
          });

          spyOn(console, 'warn');

          this.store = buildStore(this.initialState, { users: this.reducers } );
          this.store.dispatch(this.destroyUser(1));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then removes the item', function() {
          expect(this.store.getState().users.items).toEqual({});
        });
      });
    });

    describe('and the API request errors', function () {
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.delete('http://test.com/users/1', new Promise(resolve => {}));

          spyOn(console, 'warn');

          this.store = buildStore(this.initialState, { users: this.reducers } );
          this.store.dispatch(this.destroyUser(1));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then warns about the missing resource', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: DESTROY_USER\'s key \'1\' did not match any items in the store. (Destroy request was still sent to the server.)'
          );
        });

        it('then creates a new item and sets its status to DESTROYING', function() {
          expect(this.users.items[1].status.type).toEqual(DESTROYING);
        });
      });

      describe('when the request has completed', function() {
        beforeAll(function () {
          fetchMock.delete('http://test.com/users/1', {
            body: { error: 'Not Found' },
            status: 404
          });

          spyOn(console, 'warn');

          this.store = buildStore(this.initialState, { users: this.reducers } );
          this.store.dispatch(this.destroyUser(1));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then updates the items\'s status to DESTROY_ERROR', function() {
          expect(this.store.getState().users.items[1].status.type).toEqual(DESTROY_ERROR);
        });

        it('then updates the item\'s status httpCode', function() {
          expect(this.store.getState().users.items[1].status.httpCode).toEqual(404);
        });
      });
    });
  });

  [
    {
      idArgsDescription: 'and only the item\'s id is passed to the action creator',
      idArgs: 1
    },
    {
      idArgsDescription: 'and the item\'s id is passed as an object to the action creator',
      idArgs: { id: 1 }
    }
  ].forEach(({ idArgsDescription, idArgs }) => {
    describe(idArgsDescription, () => {
      describe('when the resource is in the store', function() {
        [
          {
            description: 'and it has a status of NEW',
            statusType: NEW,
            warning: 'Redux and the REST: DESTROY_USER\'s key \'1\' matched a new item. Use clearNewUser() to clear items that haven\'t been saved to the server. (Destroy request was still sent to the server.)'
          },
          {
            description: 'and it has a status of DESTROYING',
            statusType: DESTROYING,
            warning: 'Redux and the REST: DESTROY_USER\'s key \'1\' matched a new that has a pending DESTROY action. (Duplicate destroy request was still sent to the server.)'
          },
        ].forEach(function({ description, statusType, warning }) {
          describe(description, function () {
            describe('and the API request succeeds', function () {
              beforeAll(function () {
                this.initialState = { users:
                    {
                      ...this.resourceBefore,
                      items: {
                        1: {
                          values: { username: 'Bob' },
                          status: { type: statusType }
                        }
                      }
                    }
                };
              });

              describe('before the request has completed', function () {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', new Promise(resolve => {}));

                  spyOn(console, 'warn');

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));

                  this.users = this.store.getState().users;
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then warns about the conflict', function() {
                  // eslint-disable-next-line no-console
                  expect(console.warn).toHaveBeenCalledWith(warning);
                });

                it('then sets the item\'s status type to DESTROYING', function() {
                  expect(this.users.items[1].status.type).toEqual(DESTROYING);
                });
              });

              describe('when the request has completed', function() {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', {
                    body: {},
                  });

                  spyOn(console, 'warn');

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then removes the item', function() {
                  expect(this.store.getState().users.items).toEqual({});
                });
              });
            });

            describe('and the API request errors', function () {
              describe('before the request has completed', function () {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', new Promise(resolve => {}));

                  spyOn(console, 'warn');

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));

                  this.users = this.store.getState().users;
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then warns about the missing resource', function() {
                  // eslint-disable-next-line no-console
                  expect(console.warn).toHaveBeenCalledWith(
                    'Redux and the REST: DESTROY_USER\'s key \'1\' did not match any items in the store. (Destroy request was still sent to the server.)'
                  );
                });

                it('then creates a new item and sets its status to DESTROYING', function() {
                  expect(this.users.items[1].status.type).toEqual(DESTROYING);
                });
              });

              describe('when the request has completed', function() {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', {
                    body: { error: 'Not Found' },
                    status: 404
                  });

                  spyOn(console, 'warn');

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then updates the items\'s status to DESTROY_ERROR', function() {
                  expect(this.store.getState().users.items[1].status.type).toEqual(DESTROY_ERROR);
                });

                it('then updates the item\'s status httpCode', function() {
                  expect(this.store.getState().users.items[1].status.httpCode).toEqual(404);
                });
              });
            });
          });
        });

        [
          {
            description: 'and it has a status of EDITING',
            statusType: EDITING,
          },
          {
            description: 'and it has a status of CREATING',
            statusType: CREATING,
          },
          {
            description: 'and it has a status of UPDATING',
            statusType: UPDATING,
          },
          {
            description: 'and it has a status of SUCCESS',
            statusType: SUCCESS,
          },
          {
            description: 'and it has a status of ERROR',
            statusType: ERROR,
          },
        ].forEach(function({ description, statusType }) {
          describe(description, function() {
            beforeAll(function () {
              this.initialState = { users: {
                  ...this.resourceBefore,
                  items: {
                    1: {
                      values: { username: 'Bob' },
                      status: { type: statusType }
                    }
                  },
                  selectionMap: { 1: true },
                  newItemKey: 1
                }
              };
            });

            describe('and the API request succeeds', function () {
              describe('before the request has completed', function () {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', new Promise(resolve => {}));

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));

                  this.users = this.store.getState().users;
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then sets the item\'s status to DESTROYING', function() {
                  expect(this.users.items[1].status.type).toEqual(DESTROYING);
                });

                it('then does NOT remove the item from the selectionMap', function() {
                  expect(this.users.selectionMap).toEqual({ 1: true });
                });

                it('then does NOT clear the item from thew newItemKey', function() {
                  expect(this.users.newItemKey).toEqual(1);
                });
              });

              describe('when the request has completed', function() {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', {
                    body: {},
                  });

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then removes the item', function() {
                  expect(this.store.getState().users.items).toEqual({});
                });

                it('then removes the deleted item from the selectionMap', function() {
                  expect(this.store.getState().users.selectionMap).toEqual({});
                });

                it('then removes the deleted item from the newItemKey', function() {
                  expect(this.store.getState().users.newItemKey).toEqual(null);
                });
              });
            });

            describe('and the API request errors', function () {
              describe('before the request has completed', function () {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', new Promise(resolve => {}));

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));

                  this.users = this.store.getState().users;
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then sets the item\'s status to DESTROYING', function() {
                  expect(this.users.items[1].status.type).toEqual(DESTROYING);
                });

                it('then does NOT remove the item from the selectionMap', function() {
                  expect(this.users.selectionMap).toEqual({ 1: true });
                });

                it('then does NOT clear the item from thew newItemKey', function() {
                  expect(this.users.newItemKey).toEqual(1);
                });
              });

              describe('when the request has completed', function() {
                beforeAll(function () {
                  fetchMock.delete('http://test.com/users/1', {
                    body: { error: 'Not Found' },
                    status: 404
                  });

                  this.store = buildStore(this.initialState, { users: this.reducers } );

                  this.store.dispatch(this.destroyUser(idArgs));
                });

                afterAll(function() {
                  fetchMock.restore();
                  this.store = null;
                });

                it('then updates the items\'s status to DESTROY_ERROR', function() {
                  expect(this.store.getState().users.items[1].status.type).toEqual(DESTROY_ERROR);
                });

                it('then does NOT remove the item from the selectionMap', function() {
                  expect(this.store.getState().users.selectionMap).toEqual({ 1: true });
                });

                it('then does NOT clear the item from thew newItemKey', function() {
                  expect(this.store.getState().users.newItemKey).toEqual(1);
                });

                it('then updates the item\'s status httpCode', function() {
                  expect(this.store.getState().users.items[1].status.httpCode).toEqual(404);
                });
              });
            });
          });
        });
      });
    });
  });
});
