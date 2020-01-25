import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, ERROR, SUCCESS, UPDATING, RESOURCES } from '../../../index';

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
      beforeAll(function () {
        fetchMock.put('http://test.com/users/1', {
          body: { id: 1, username: 'Robert', approved: false },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

        spyOn(console, 'warn');

        this.store.dispatch(this.updateUser(1, {
          username: 'Robert'
        }));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then warns about trying to update an item not in the store', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith('Redux and the REST: UPDATE_USER\'s key \'1\' did not match any items in the store. Check the arguments passed to update*(). (Update request still sent to the server.)');
        });

        it('then adds a new item with a status of UPDATING', function() {
          expect(this.users.items[1].status.type).toEqual(UPDATING);
        });

        it('then adds a new item with values specified', function() {
          expect(this.users.items[1].values).toEqual({ username: 'Robert' });
        });

      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then changes the items\'s status type to SUCCESS', function() {
          expect(this.users.items[1].status.type).toEqual(SUCCESS);
        });

        it('then sets the item\'s values from the response', function() {
          expect(this.users.items[1].values).toEqual({ id: 1, username: 'Robert', approved: false });
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
          beforeAll(function () {
            fetchMock.put('http://test.com/users/1', {
              body: { id: 1, username: 'Robert', approved: false },
            }, new Promise((resolve) => {
              this.resolveRequest = resolve;
            }));

            this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

            this.store.dispatch(this.updateUser(idArgs, {
              username: 'Robert'
            }));

            this.users = this.store.getState().users;
          });

          afterAll(function() {
            fetchMock.restore();
          });

          describe('before the request has completed', function () {
            it('then sets the item\'s status type to UPDATING', function() {
              expect(this.users.items[1].status.type).toEqual(UPDATING);
            });

            it('then merges in the new values with the item\'s old ones', function() {
              expect(this.users.items[1].values).toEqual({ username: 'Robert', id: 1 });
            });
          });

          describe('when the request has completed', function () {
            beforeAll(function () {
              this.resolveRequest();

              this.users = this.store.getState().users;
            });

            it('then changes the items\'s status type to SUCCESS', function() {
              expect(this.users.items[1].status.type).toEqual(SUCCESS);
            });

            it('then sets the item\'s values from the response', function() {
              expect(this.users.items[1].values).toEqual({ id: 1, username: 'Robert', approved: false });
            });
          });
        });

        describe('and the API request errors', function() {
          beforeAll(function () {
            fetchMock.put('http://test.com/users/1', {
              body: { error: 'Not Found' },
              status: 404
            }, new Promise((resolve) => {
              this.resolveRequest = resolve;
            }));

            this.store = buildStore({ users: this.resourceBefore }, { users: this.reducers } );

            this.store.dispatch(this.updateUser(idArgs, {
              username: 'Robert'
            }));

            this.users = this.store.getState().users;
          });

          afterAll(function() {
            fetchMock.restore();
          });

          describe('before the request has completed', function () {
            it('then sets the item\'s status type to UPDATING', function() {
              expect(this.users.items[1].status.type).toEqual(UPDATING);
            });

            it('then merges in the new values with the item\'s old ones', function() {
              expect(this.users.items[1].values).toEqual({ username: 'Robert', id: 1 });
            });
          });

          describe('when the request has completed', function () {
            beforeAll(function () {
              this.resolveRequest();

              this.users = this.store.getState().users;
            });

            it('then changes the items\'s status type to ERROR', function() {
              expect(this.users.items[1].status.type).toEqual(ERROR);
            });

            it('then updates the item\'s status httpCode', function() {
              expect(this.users.items[1].status.httpCode).toEqual(404);
            });

            it('then does not update the values from the response', function() {
              expect(this.users.items[1].values).toEqual({ id: 1, username: 'Robert' });
            });

            it('then does sets the status error from the response', function() {
              expect(this.users.items[1].status.error.message).toEqual('Not Found');
            });
          });
        });
      });
    });
  });
});
