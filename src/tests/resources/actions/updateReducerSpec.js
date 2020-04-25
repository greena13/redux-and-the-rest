import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, ERROR, SUCCESS, UPDATING, RESOURCES, EDITING } from '../../../index';

describe('Update reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { updateUser } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
    }, {
      update: true
    });

    this.updateUser = updateUser;
    this.reducers = reducers;
  });

  describe('when the resource is NOT in the store', function () {
    beforeAll(function () {
      this.resourceBefore = {
        ...RESOURCES,
        items: { },
      };
    });

    describe('and the API request succeeds', function() {
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.put('http://test.com/users/1', new Promise(resolve => {}));

          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          spyOn(console, 'warn');

          this.store.dispatch(this.updateUser(1, {
            username: 'Robert'
          }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then warns about trying to update an item not in the store', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith('Redux and the REST: UPDATE_USER\'s key \'1\' did not match any items in the store. Check the arguments passed to updateUser(). (Update request still sent to the server.)');
        });

        it('then adds a new item with a status of UPDATING', function() {
          expect(this.store.getState().users.items[1].status.type).toEqual(UPDATING);
        });

        it('then adds a new item with values specified', function() {
          expect(this.store.getState().users.items[1].values).toEqual({ username: 'Robert' });
        });
      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          fetchMock.put('http://test.com/users/1', {
            body: { id: 1, username: 'Robert', approved: false },
          });

          this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

          spyOn(console, 'warn');

          this.store.dispatch(this.updateUser(1, {
            username: 'Robert'
          }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then changes the items\'s status type to SUCCESS', function() {
          expect(this.store.getState().users.items[1].status.type).toEqual(SUCCESS);
        });

        it('then sets the item\'s values from the response', function() {
          expect(this.store.getState().users.items[1].values).toEqual({ id: 1, username: 'Robert', approved: false });
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
      describe('when the resource is in the store', function () {
        beforeAll(function () {
          this.resourceBefore = {
            ...RESOURCES,
            items: {
              1: {
                values: { username: 'Bob', id: 1 },
                status: { type: SUCCESS }
              }
            },
          };
        });

        describe('and the API request succeeds', function() {
          describe('before the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', new Promise(resolve => {}));

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then sets the item\'s status type to UPDATING', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(UPDATING);
            });

            it('then merges in the new values with the item\'s old ones', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ username: 'Robert', id: 1 });
            });
          });

          describe('when the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', {
                body: { id: 1, username: 'Robert', approved: false },
              });

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then changes the items\'s status type to SUCCESS', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(SUCCESS);
            });

            it('then sets the item\'s values from the response', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ id: 1, username: 'Robert', approved: false });
            });
          });
        });

        describe('and the API request errors', function() {
          describe('before the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', new Promise(resolve => {}));

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then sets the item\'s status type to UPDATING', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(UPDATING);
            });

            it('then merges in the new values with the item\'s old ones', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ username: 'Robert', id: 1 });
            });
          });

          describe('when the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', {
                body: { error: 'Not Found' },
                status: 404
              });

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then changes the items\'s status type to ERROR', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(ERROR);
            });

            it('then sets the syncedAt attribute', function() {
              expect(this.store.getState().users.items[1].status.errorOccurredAt).not.toBeUndefined();
            });

            it('then updates the item\'s status httpCode', function() {
              expect(this.store.getState().users.items[1].status.httpCode).toEqual(404);
            });

            it('then does not update the values from the response', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ id: 1, username: 'Robert' });
            });

            it('then does sets the status error from the response', function() {
              expect(this.store.getState().users.items[1].status.error.message).toEqual('Not Found');
            });
          });
        });
      });
    });

    describe('Given the resource item has been edited previously', () => {
      describe('when the resource item is updated', () => {
        beforeAll(function () {
          this.resourceBefore = {
            ...RESOURCES,
            items: {
              1: {
                values: { username: 'Bob', id: 1 },
                status: {
                  type: EDITING,
                  dirty: true,
                  originalValues: { username: 'Bobert', id: 1 }
                }
              }
            },
          };
        });

        describe('and the API request succeeds', function() {
          describe('before the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', new Promise(resolve => {}));

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then sets the item\'s status type to UPDATING', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(UPDATING);
            });

            it('then does NOT unset the dirty bit', function() {
              expect(this.store.getState().users.items[1].status.dirty).toEqual(true);
            });

            it('then does NOT clear the originalValues', function() {
              expect(this.store.getState().users.items[1].status.originalValues).toEqual({ username: 'Bobert', id: 1 });
            });

            it('then merges in the new values with the item\'s old ones', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ username: 'Robert', id: 1 });
            });
          });

          describe('when the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', {
                body: { id: 1, username: 'Robert', approved: false },
              });

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then changes the items\'s status type to SUCCESS', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(SUCCESS);
            });

            it('then removes the dirty bit', function() {
              expect(this.store.getState().users.items[1].status.dirty).toEqual(undefined);
            });

            it('then clears the original values', function() {
              expect(this.store.getState().users.items[1].status.originalValues).toEqual(undefined);
            });

            it('then sets the item\'s values from the response', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ id: 1, username: 'Robert', approved: false });
            });
          });
        });

        describe('and the API request errors', function() {
          describe('before the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', new Promise(resolve => {}));

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then sets the item\'s status type to UPDATING', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(UPDATING);
            });

            it('then does NOT unset the dirty bit', function() {
              expect(this.store.getState().users.items[1].status.dirty).toEqual(true);
            });

            it('then merges in the new values with the item\'s old ones', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ username: 'Robert', id: 1 });
            });
          });

          describe('when the request has completed', function () {
            beforeAll(function () {
              fetchMock.put('http://test.com/users/1', {
                body: { error: 'Not Found' },
                status: 404
              });

              this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

              this.store.dispatch(this.updateUser(idArgs, {
                username: 'Robert'
              }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then does NOT unset the dirty bit', function() {
              expect(this.store.getState().users.items[1].status.dirty).toEqual(true);
            });

            it('then does NOT clear the originalValues', function() {
              expect(this.store.getState().users.items[1].status.originalValues).toEqual({ username: 'Bobert', id: 1 });
            });

            it('then changes the items\'s status type to ERROR', function() {
              expect(this.store.getState().users.items[1].status.type).toEqual(ERROR);
            });

            it('then sets the syncedAt attribute', function() {
              expect(this.store.getState().users.items[1].status.errorOccurredAt).not.toBeUndefined();
            });

            it('then updates the item\'s status httpCode', function() {
              expect(this.store.getState().users.items[1].status.httpCode).toEqual(404);
            });

            it('then does not update the values from the response', function() {
              expect(this.store.getState().users.items[1].values).toEqual({ id: 1, username: 'Robert' });
            });

            it('then does sets the status error from the response', function() {
              expect(this.store.getState().users.items[1].status.error.message).toEqual('Not Found');
            });
          });
        });
      });
    });
  });
});
