import { resources, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';
import fetchMock from 'fetch-mock';
import { PREVIEW } from '../../../index';
import nop from '../../utils/function/nop';
import EmptyKey from '../../constants/EmptyKey';

describe('metadata:', function () {
  describe('when configuring the INDEX action', function() {
    describe('and the metadata value is NOT set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchList: fetchUsers } } = resources({
          name: 'users',
          url: 'http://test.com/users',
          keyBy: 'id'
        }, {
          fetchList: true
        });

        this.reducers = reducers;
        this.fetchUsers = fetchUsers;
      });

      describe('and the metadata type is set when calling the action creator', function() {
        describe('and the request succeeds', () => {
          describe('before the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', new Promise(nop));

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: PREVIEW } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then uses the value passed to the action creator for the item\'s metadata type', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual(PREVIEW);
            });
          });

          describe('when the request completes', function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', {
                    body: [{ id: 1, username: 'Robert' }],
              });

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: PREVIEW }, itemsMetadata: { type: PREVIEW } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then uses the value passed to the action creator for the item\'s metadata type', function() {
              expect(this.store.getState().users.items['1'].metadata.type).toEqual(PREVIEW);
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual(PREVIEW);
            });
          });
        });

        describe('and the request errors', () => {
          describe('before the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', new Promise(nop));

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: PREVIEW } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then the list\'s metadata type is the value passed to the action creator', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual(PREVIEW);
            });
          });

          describe('when the request completes', function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', {
                body: { error: 'Not Found' },
                status: 404
              });

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: PREVIEW } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then the list\'s metadata type is the value passed to the action creator', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual(PREVIEW);
            });
          });
        });
      });
    });

    describe('and the metadata type is set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchList: fetchUsers } } = resources({
          name: 'users',
          url: 'http://test.com/users',
          keyBy: 'id',
          metadata: { type: 'RESOURCE_METADATA' }
        }, {
          fetchList: true
        });

        this.fetchUsers = fetchUsers;
        this.reducers = reducers;
      });

      describe('and the metadata type is NOT set when calling the action creator', function() {
        describe('and the request succeeds', () => {
          describe('before the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', new Promise(nop));

              this.store.dispatch(this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then the item and list\'s metadata type is the value specified when defining the resource', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('RESOURCE_METADATA');
            });
          });

          describe('when the request completes', function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', {
                body: [{ id: 1, username: 'Robert' }],
              });

              this.store.dispatch(this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then the item and list\'s metadata type is the value specified when defining the resource', function() {
              expect(this.store.getState().users.items['1'].metadata.type).toEqual('RESOURCE_METADATA');
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('RESOURCE_METADATA');
            });
          });
        });

        describe('and the request errors', () => {
          describe('before the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', new Promise(nop));

              this.store.dispatch(this.fetchUsers());
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then the list\'s metadata type is the value specified when defining the resource', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('RESOURCE_METADATA');
            });
          });

          describe('when the request completes', function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

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

            it('then the list\'s metadata type is the value specified when defining the resource', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('RESOURCE_METADATA');
            });
          });
        });
      });

      describe('and the metadata type is set when calling the action creator', function() {
        describe('and the request succeeds', () => {
          describe('before the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', new Promise(nop));

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: 'ACTION_CREATOR_METADATA' } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then uses the value passed to the action creator for the list\'s metadata type', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('ACTION_CREATOR_METADATA');
            });
          });

          describe('when the request completes', function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', {
                body: [{ id: 1, username: 'Robert' }],
              });

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: 'ACTION_CREATOR_METADATA' }, itemsMetadata: { type: 'ACTION_CREATOR_ITEM_METADATA' } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then uses the value passed to the action creator for the item and list\'s metadata type', function() {
              expect(this.store.getState().users.items['1'].metadata.type).toEqual('ACTION_CREATOR_ITEM_METADATA');
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('ACTION_CREATOR_METADATA');
            });
          });
        });

        describe('and the request errors', () => {
          describe('before the request has completed', function () {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', new Promise(nop));

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: 'ACTION_CREATOR_METADATA' } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then uses the value passed to the action creator for the list\'s metadata type', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('ACTION_CREATOR_METADATA');
            });
          });

          describe('when the request completes', function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...RESOURCES
                }
              }, { users: this.reducers } );

              fetchMock.get('http://test.com/users', {
                body: { error: 'Not Found' },
                status: 404
              });

              this.store.dispatch(this.fetchUsers({}, { metadata: { type: 'ACTION_CREATOR_METADATA' } }));
            });

            afterAll(function() {
              fetchMock.restore();
              this.store = null;
            });

            it('then uses the value passed to the action creator for the list\'s metadata type', function() {
              expect(this.store.getState().users.lists[EmptyKey].metadata.type).toEqual('ACTION_CREATOR_METADATA');
            });
          });
        });
      });
    });
  });

  describe('when configuring the SHOW action', function() {
    describe('and the metadata type is NOT set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchItem: fetchUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id'
        }, {
          fetchItem: true
        });

        this.reducers = reducers;
        this.fetchUser = fetchUser;
      });

      describe('and the metadata type is set when calling the action creator', function() {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1, { metadata: { type: PREVIEW } }));

            this.user = this.store.getState().users.items['1'];
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then uses the value passed to the action creator for the item\'s metadata type', function() {
            expect(this.user.metadata.type).toEqual(PREVIEW);
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', {
              body: { id: 1, username: 'Robert' },
            });

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1, { metadata: { type: PREVIEW } }));

            this.user = this.store.getState().users.items['1'];
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then uses the value passed to the action creator for the item\'s metadata type', function() {
            expect(this.user.metadata.type).toEqual(PREVIEW);
          });
        });
      });
    });

    describe('and the metadata type is set when defining the resource', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchItem: fetchUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id',
          metadata: { type: 'RESOURCE_METADATA' }
        }, {
          fetchItem: true
        });

        this.reducers = reducers;
        this.fetchUser = fetchUser;
      });

      describe('and the metadata type is NOT set when calling the action creator', function() {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1));

            this.user = this.store.getState().users.items['1'];
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s metadata type is the value specified when defining the resource', function() {
            expect(this.user.metadata.type).toEqual('RESOURCE_METADATA');
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', {
              body: { id: 1, username: 'Robert' },
            });

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1));

            this.user = this.store.getState().users.items['1'];
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s metadata type is the value specified when defining the resource', function() {
            expect(this.user.metadata.type).toEqual('RESOURCE_METADATA');
          });
        });
      });

      describe('and the metadata type is set when calling the action creator', function() {
        describe('before the request has completed', function () {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1, { metadata: { type: 'ACTION_CREATOR_METADATA' } }));

            this.user = this.store.getState().users.items['1'];
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then uses the value passed to the action creator for the item\'s metadata type', function() {
            expect(this.user.metadata.type).toEqual('ACTION_CREATOR_METADATA');
          });
        });

        describe('when the request completes', function() {
          beforeAll(function () {
            fetchMock.get('http://test.com/users/1', {
              body: { id: 1, username: 'Robert' },
            });

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUser(1, { metadata: { type: 'ACTION_CREATOR_METADATA' } }));

            this.user = this.store.getState().users.items['1'];
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then uses the value passed to the action creator for the item\'s metadata type', function() {
            expect(this.user.metadata.type).toEqual('ACTION_CREATOR_METADATA');
          });
        });
      });
    });
  });
});
