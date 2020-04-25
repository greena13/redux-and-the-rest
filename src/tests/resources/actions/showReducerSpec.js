import fetchMock from 'fetch-mock';
import buildStore from '../../helpers/buildStore';
import { resources, ERROR, FETCHING, SUCCESS, RESOURCES } from '../../../index';
import nop from '../../../utils/function/nop';

describe('Show reducers:', function () {
  describe('when the keyBy option is a string', function () {
    beforeAll(function() {
      const { reducers, actionCreators: { fetchUser } } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
      }, {
        show: true
      });

      this.fetchUser = fetchUser;
      this.reducers = reducers;
    });

    describe('when no actions have come before it', () => {
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
          describe('and the API request succeeds', function() {
            describe('before the request has completed', function () {
              beforeAll(function () {
                fetchMock.get('http://test.com/users/1', new Promise(nop));

                this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
                this.store.dispatch(this.fetchUser(idArgs));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then adds a new item with a status of FETCHING', function() {
                expect(this.store.getState().users.items['1'].status.type).toEqual(FETCHING);
              });

              it('then adds a new item with empty values', function() {
                expect(this.store.getState().users.items['1'].values).toEqual({});
              });

              it('then does NOT add the item to the default collection', function() {
                expect(this.store.getState().users.collections).toEqual({});
              });
            });

            describe('when the request has completed', function () {
              beforeAll(function () {
                fetchMock.get('http://test.com/users/1', {
                  body: { id: 1, username: 'Bob' },
                });

                this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
                this.store.dispatch(this.fetchUser(idArgs));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then changes the items\'s status type to SUCCESS', function() {
                expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
              });

              it('then sets the item\'s values from the response', function() {
                expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Bob' });
              });
            });
          });

          describe('when the API request errors', function() {
            describe('before the request has completed', function () {
              beforeAll(function () {
                fetchMock.get('http://test.com/users/1', new Promise(nop));

                this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
                this.store.dispatch(this.fetchUser(idArgs));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then adds a new item with a status of FETCHING', function() {
                expect(this.store.getState().users.items['1'].status.type).toEqual(FETCHING);
              });

              it('then adds a new item with empty values', function() {
                expect(this.store.getState().users.items['1'].values).toEqual({});
              });

              it('then does NOT add the item to the default collection', function() {
                expect(this.store.getState().users.collections).toEqual({});
              });
            });

            describe('when the request has completed', function () {
              beforeAll(function () {
                fetchMock.get('http://test.com/users/1', {
                  body: { error: 'Not Found' },
                  status: 404
                });

                this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
                this.store.dispatch(this.fetchUser(idArgs));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then changes the items\'s status type to ERROR', function() {
                expect(this.store.getState().users.items['1'].status.type).toEqual(ERROR);
              });

              it('then sets the syncedAt attribute', function() {
                expect(this.store.getState().users.items['1'].status.errorOccurredAt).not.toBeUndefined();
              });

              it('then updates the item\'s status httpCode', function() {
                expect(this.store.getState().users.items['1'].status.httpCode).toEqual(404);
              });

              it('then sets the item\'s status error from the response', function() {
                expect(this.store.getState().users.items['1'].status.error.message).toEqual('Not Found');
              });

              it('then does NOT set the item\'s values from the response', function() {
                expect(this.store.getState().users.items['1'].values).toEqual({ });
              });
            });
          });
        });
      });
    });

    describe('when another show action has come before it', function () {
      beforeAll(function () {
        this.resourceBefore = {
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
        };
      });

      describe('and the API request succeeds', () => {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: this.resourceBefore
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then sets the status of the item to FETCHING', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(FETCHING);
          });

          it('then does NOT clear the item\'s values', function() {
            expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Bob' });
          });

          it('then does NOT add the item to the default collection', function() {
            expect(this.store.getState().users.collections).toEqual({});
          });
        });

        describe('when the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', {
              body: { id: 1, username: 'Robert' },
            });

            this.store = buildStore({
              users: this.resourceBefore
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then changes the items\'s status type to SUCCESS', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
          });

          it('then sets the item\'s values from the response', function() {
            expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Robert' });
          });
        });
      });

      describe('when the API request errors', function() {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: this.resourceBefore
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then sets the status of the item to FETCHING', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(FETCHING);
          });

          it('then does NOT clear the item\'s values', function() {
            expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Bob' });
          });

          it('then does NOT add the item to the default collection', function() {
            expect(this.store.getState().users.collections).toEqual({});
          });
        });

        describe('when the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', {
              body: { error: 'Not Found' },
              status: 404
            });

            this.store = buildStore({
              users: this.resourceBefore
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then changes the items\'s status type to ERROR', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(ERROR);
          });

          it('then updates the item\'s status httpCode', function() {
            expect(this.store.getState().users.items['1'].status.httpCode).toEqual(404);
          });

          it('then sets the syncedAt attribute', function() {
            expect(this.store.getState().users.items['1'].status.errorOccurredAt).not.toBeUndefined();
          });

          it('then sets the item\'s status error from the response', function() {
            expect(this.store.getState().users.items['1'].status.error.message).toEqual('Not Found');
          });

          it('then does NOT set the item\'s values from the response', function() {
            expect(this.store.getState().users.items['1'].values).toEqual({ id: 1, username: 'Bob' });
          });
        });
      });
    });
  });

  describe('when the keyBy option is an array', () => {
    beforeAll(function() {
      const { reducers, actionCreators: { fetchUser } } = resources({
        name: 'users',
        url: 'http://test.com/groups/:groupId/users/:id?',
        keyBy: ['id', 'groupId'],
      }, {
        show: true
      });

      this.fetchUser = fetchUser;
      this.reducers = reducers;
    });

    describe('and the API request succeeds', function() {
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.get('http://test.com/groups/1/users/1', new Promise(nop));

          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
          this.store.dispatch(this.fetchUser({ id: 1, groupId: 1 }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then adds a new item with a status of FETCHING', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.type).toEqual(FETCHING);
        });

        it('then adds a new item with empty values', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].values).toEqual({});
        });

        it('then does NOT add the item to the default collection', function() {
          expect(this.store.getState().users.collections).toEqual({});
        });
      });

      describe('when the request has completed', function () {
        beforeAll(function () {
          fetchMock.get('http://test.com/groups/1/users/1', {
                body: { id: 1, username: 'Bob' },
          });

          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
          this.store.dispatch(this.fetchUser({ id: 1, groupId: 1 }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then changes the items\'s status type to SUCCESS', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.type).toEqual(SUCCESS);
        });

        it('then sets the item\'s values from the response', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].values).toEqual({ id: 1, username: 'Bob' });
        });
      });
    });

    describe('and the API request errors', function() {
      describe('before the request has completed', function () {
        beforeAll(function () {
          fetchMock.get('http://test.com/groups/1/users/1', new Promise(nop));

          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
          this.store.dispatch(this.fetchUser({ id: 1, groupId: 1 }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then adds a new item with a status of FETCHING', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.type).toEqual(FETCHING);
        });

        it('then adds a new item with empty values', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].values).toEqual({});
        });

        it('then does NOT add the item to the default collection', function() {
          expect(this.store.getState().users.collections).toEqual({});
        });
      });

      describe('and the request has completed', function () {
        beforeAll(function () {
          fetchMock.get('http://test.com/groups/1/users/1', {
            body: { error: 'Not Found' },
            status: 404
          });

          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );
          this.store.dispatch(this.fetchUser({ id: 1, groupId: 1 }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then changes the items\'s status type to ERROR', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.type).toEqual(ERROR);
        });

        it('then sets the syncedAt attribute', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.errorOccurredAt).not.toBeUndefined();
        });

        it('then updates the item\'s status httpCode', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.httpCode).toEqual(404);
        });

        it('then sets the item\'s status error from the response', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].status.error.message).toEqual('Not Found');
        });

        it('then does NOT set the item\'s values from the response', function() {
          expect(this.store.getState().users.items['groupId=1.id=1'].values).toEqual({ });
        });
      });
    });
  });
});
