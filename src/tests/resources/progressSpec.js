import fetchMock from 'fetch-mock';
import XHRMock from '../helpers/XHRMock';

import { resources, RESOURCES, CREATING, FETCHING, SUCCESS, UPDATING } from '../../index';
import buildStore from '../helpers/buildStore';
import nop from '../../utils/function/nop';
import EmptyKey from '../../constants/EmptyKey';

describe('progress option', function () {
  describe('for the create action:', function () {
    describe('when it is NOT set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { createItem: createUser } } = resources({
          name: 'users',
          url: 'http://test.com/users',
          keyBy: 'id'
        }, {
          create: true
        });

        this.reducers = reducers;
        this.createUser = createUser;
      });

      describe('and the API request succeeds', function () {
        describe('before the request has completed', function () {
          beforeAll(function() {
            fetchMock.post('http://test.com/users', new Promise(nop));

            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }));
          });

          afterAll(function () {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s status is CREATING', function() {
            expect(this.store.getState().users.items.temp.status.type).toEqual(CREATING);
          });

          it('then there are no progress attributes on the item\'s status object', function() {
            const userStatus = this.store.getState().users.items.temp.status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('when the request completes', () => {
          beforeAll(function() {
            fetchMock.post('http://test.com/users', {
              body: { id: 1, username: 'Bob' },
            });

            this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

            this.store.dispatch(this.createUser('temp', {
              username: 'Bob'
            }));
          });

          afterAll(function () {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s status is SUCCESS', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
          });

          it('then does not set the item\'s progress status attributes', function() {
            const userStatus = this.store.getState().users.items['1'].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });
      });
    });

    describe('Given it is set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { createItem: createUser } } = resources({
          name: 'users',
          url: 'http://test.com/users',
          keyBy: 'id'
        }, {
          create: {
            progress: true
          }
        });

        this.reducers = reducers;
        this.createUser = createUser;

        XHRMock.setup();
      });

      afterAll(function() {
        XHRMock.tearDown();
      });

      describe('and the API request succeeds,', function () {
        beforeAll(function () {
          this.xhrMock = XHRMock.post('http://test.com/users', {
            body: { id: 1, username: 'Bob' },
          });

          this.store = buildStore({ users: RESOURCES }, { users: this.reducers } );

          this.store.dispatch(this.createUser('temp', {
            username: 'Bob'
          }));

          this.userStatus = this.store.getState().users.items.temp.status;
        });

        afterAll(function() {
          XHRMock.reset();

          this.store = null;
        });

        describe('before the request has completed', function () {
          it('then the item\'s status is CREATING', function() {
            expect(this.userStatus.type).toEqual(CREATING);
          });

          it('then there are no progress attributes on the item\'s status object', function() {
            expect(this.userStatus.progressUp).toEqual(undefined);
            expect(this.userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('and the request progresses', () => {
          beforeAll(function () {
            this.xhrMock.setUploadProgress({
              lengthComputable: true,
              loaded: 12,
              total: 24
            });

            this.userStatus = this.store.getState().users.items.temp.status;
          });

          it('then the item\'s status is still CREATING', function() {
            expect(this.userStatus.type).toEqual(CREATING);
          });

          it('then the item\'s progressUp status is updated with the current values', function() {
            expect(this.userStatus.progressUp).toEqual({
              percent: 50,
              loaded: 12,
              total: 24,
              lengthComputable: true,
            });

            expect(this.userStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

        });

        describe('and the upload has finished', () => {
          beforeAll(function () {
            this.xhrMock.completeUpload({ status: 200 });
            this.userStatus = this.store.getState().users.items.temp.status;
          });

          it('then the item\'s status is still CREATING', function() {
            expect(this.userStatus.type).toEqual(CREATING);
          });

          it('then the item\'s progressUp is updated with the current values', function() {
            expect(this.userStatus.progressUp).toEqual({
              percent: 100,
              loaded: 24,
              total: 24,
              lengthComputable: true,
            });

            expect(this.userStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

          describe('and the response is still downloading', () => {
            beforeAll(function () {
              this.xhrMock.setDownloadProgress({
                lengthComputable: true,
                loaded: 13,
                total: 25
              });

              this.userStatus = this.store.getState().users.items.temp.status;
            });

            it('then the item\'s status is still CREATING', function() {
              expect(this.userStatus.type).toEqual(CREATING);
            });

            it('then the item\'s progressUp is updated with the current values', function() {
              expect(this.userStatus.progressUp).toEqual({
                percent: 100,
                loaded: 24,
                total: 24,
                lengthComputable: true,
              });

              expect(this.userStatus.progressDown).toEqual({
                percent: 52,
                loaded: 13,
                total: 25,
                lengthComputable: true,
              });
            });
          });

          describe('and the response has finished downloading', () => {
            beforeAll(function () {
              return this.xhrMock.completeDownload().then(() => {
                this.userStatus = this.store.getState().users.items['1'].status;
              });
            });

            it('then the item\'s status type is set to SUCCESS', function() {
              expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
            });

            it('then the item\'s progressUp status is updated with the current values', function() {
              expect(this.store.getState().users.items['1'].status.progressUp).toEqual({
                percent: 100,
                loaded: 24,
                total: 24,
                lengthComputable: true,
              });

              expect(this.store.getState().users.items['1'].status.progressDown).toEqual({
                percent: 100,
                loaded: 25,
                total: 25,
                lengthComputable: true,
              });
            });
          });
        });
      });
    });
  });

  describe('for the update action:', function () {
    describe('when it is NOT set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { updateItem: updateUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id'
        }, {
          update: true
        });

        this.reducers = reducers;
        this.updateUser = updateUser;
      });

      describe('and the API request succeeds', function () {
        describe('before the request has completed', function () {
          beforeAll(function() {
            fetchMock.put('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: {
                ...RESOURCES,
                items: {
                  1: {
                    values: {
                      id: 1,
                      username: 'Bob'
                    },
                    status: {
                      type: SUCCESS,
                    }
                  },
                }
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.updateUser(1, {
              id: 1,
              username: 'Bob'
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s status is UPDATING', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(UPDATING);
          });

          it('then there are no progress attributes on the item\'s status object', function() {
            const userStatus = this.store.getState().users.items['1'].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('when the request completes', () => {
          beforeAll(function() {
            fetchMock.put('http://test.com/users/1', {
              body: { id: 1, username: 'Robert' }
            });

            this.store = buildStore({
              users: {
                ...RESOURCES,
                items: {
                  1: {
                    values: {
                      id: 1,
                      username: 'Bob'
                    },
                    status: {
                      type: SUCCESS,
                    }
                  },
                }
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.updateUser(1, {
              id: 1,
              username: 'Bob'
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s status is SUCCESS', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
          });

          it('then does not set the item\'s progress status attributes', function() {
            const userStatus = this.store.getState().users.items['1'].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });
      });
    });

    describe('when it is set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { updateItem: updateUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id'
        }, {
          update: {
            progress: true
          }
        });

        this.reducers = reducers;
        this.updateUser = updateUser;

        XHRMock.setup();
      });

      afterAll(function() {
        XHRMock.tearDown();
      });

      describe('and the API request succeeds', function () {
        beforeAll(function () {
          this.xhrMock = XHRMock.put('http://test.com/users/1', {
            body: { id: 1, username: 'Bob' },
          });

          this.store = buildStore({
            users: {
              ...RESOURCES,
              items: {
                1: {
                  values: {
                    id: 1,
                    username: 'Bob'
                  },
                  status: {
                    type: SUCCESS,
                  }
                },
              }
            }
          }, { users: this.reducers } );

          this.store.dispatch(this.updateUser(1, {
            id: 1,
            username: 'Robert',
          }));

          this.userStatus = this.store.getState().users.items['1'].status;
        });

        afterAll(function() {
          XHRMock.reset();
          this.store = null;
        });

        describe('before the request has completed', function () {
          it('then the item\'s status is UPDATING', function() {
            expect(this.userStatus.type).toEqual(UPDATING);
          });

          it('then there are no progress attributes on the item\'s status object', function() {
            expect(this.userStatus.progressUp).toEqual(undefined);
            expect(this.userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('and the request progresses', () => {
          beforeAll(function () {
            this.xhrMock.setUploadProgress({
              lengthComputable: true,
              loaded: 12,
              total: 24
            });

            this.userStatus = this.store.getState().users.items['1'].status;
          });

          it('then the item\'s status is still UPDATING', function() {
            expect(this.userStatus.type).toEqual(UPDATING);
          });

          it('then the item\'s progressUp status is updated with the current values', function() {
            expect(this.userStatus.progressUp).toEqual({
              percent: 50,
              loaded: 12,
              total: 24,
              lengthComputable: true,
            });

            expect(this.userStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });
        });

        describe('and the upload has finished', () => {
          beforeAll(function () {
            this.xhrMock.completeUpload({ status: 200 });
            this.userStatus = this.store.getState().users.items['1'].status;
          });

          it('then the item\'s status is still UPDATING', function() {
            expect(this.userStatus.type).toEqual(UPDATING);
          });

          it('then the item\'s progressUp is updated with the current values', function() {

            expect(this.userStatus.progressUp).toEqual({
              percent: 100,
              loaded: 36,
              total: 36,
              lengthComputable: true,
            });

            expect(this.userStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

          describe('and the response is downloading', () => {
            beforeAll(function () {
              this.xhrMock.setDownloadProgress({
                lengthComputable: true,
                loaded: 13,
                total: 25
              });

              this.userStatus = this.store.getState().users.items['1'].status;
            });

            it('then the item\'s status is still UPDATING', function() {
              expect(this.userStatus.type).toEqual(UPDATING);
            });

            it('then the item\'s progressUp is updated with the current values', function() {

              expect(this.userStatus.progressUp).toEqual({
                percent: 100,
                loaded: 36,
                total: 36,
                lengthComputable: true,
              });

              expect(this.userStatus.progressDown).toEqual({
                percent: 52,
                loaded: 13,
                total: 25,
                lengthComputable: true,
              });
            });

            describe('and downloading the response is complete', () => {
              beforeAll(function () {
                return this.xhrMock.completeDownload().then(() => {
                  this.userStatus = this.store.getState().users.items['1'].status;
                });
              });

              it('then the item\'s status type is set to SUCCESS', function() {
                expect(this.userStatus.type).toEqual(SUCCESS);
              });

              it('then the item\'s progressUp status is updated with the current values', function() {
                expect(this.userStatus.progressUp).toEqual({
                  percent: 100,
                  loaded: 36,
                  total: 36,
                  lengthComputable: true,
                });

                expect(this.userStatus.progressDown).toEqual({
                  percent: 100,
                  loaded: 25,
                  total: 25,
                  lengthComputable: true,
                });
              });
            });
          });
        });
      });
    });
  });

  describe('for the fetchItem action:', function () {
    describe('when it is NOT set to a truthy value', function () {
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

      describe('and the API request succeeds', function () {
        describe('before the request has completed', function () {
          beforeAll(function() {
            fetchMock.get('http://test.com/users/1', new Promise(nop));

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers });

            this.store.dispatch(this.fetchUser(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s status is FETCHING', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(FETCHING);
          });

          it('then there are no progress attributes on the item\'s status object', function() {
            const userStatus = this.store.getState().users.items['1'].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('when the request completes', () => {
          beforeAll(function() {
            fetchMock.get('http://test.com/users/1', {
              body: { id: 1, username: 'Robert' }
            });

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers });

            this.store.dispatch(this.fetchUser(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the item\'s status is SUCCESS', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
          });

          it('then does not set the item\'s progress status attributes', function() {
            const userStatus = this.store.getState().users.items['1'].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });
      });
    });

    describe('when it is set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchItem: fetchUser } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id',
          keyBy: 'id'
        }, {
          fetchItem: {
            progress: true
          }
        });

        this.reducers = reducers;
        this.fetchUser = fetchUser;

        XHRMock.setup();
      });

      afterAll(function() {
        XHRMock.tearDown();
      });

      describe('and the API request succeeds', function () {
        beforeAll(function () {
          this.xhrMock = XHRMock.get('http://test.com/users/1', {
            body: { id: 1, username: 'Bob' },
          });

          this.store = buildStore({
            users: {
              ...RESOURCES,
            }
          }, { users: this.reducers } );

          this.store.dispatch(this.fetchUser(1));

          this.userStatus = this.store.getState().users.items['1'].status;
        });

        afterAll(function() {
          XHRMock.reset();
        });

        describe('before the request has completed', function () {
          it('then the item\'s status is FETCHING', function() {
            expect(this.userStatus.type).toEqual(FETCHING);
          });

          it('then there are no progress attributes on the item\'s status object', function() {
            expect(this.userStatus.progressUp).toEqual(undefined);
            expect(this.userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('and the request progresses', () => {
          beforeAll(function () {
            this.xhrMock.setUploadProgress({
              lengthComputable: true,
              loaded: 12,
              total: 24
            });

            this.userStatus = this.store.getState().users.items['1'].status;
          });

          it('then the item\'s status is still FETCHING', function() {
            expect(this.userStatus.type).toEqual(FETCHING);
          });

          it('then the item\'s progressUp status is updated with the current values', function() {
            expect(this.userStatus.progressUp).toEqual({
              percent: 50,
              loaded: 12,
              total: 24,
              lengthComputable: true,
            });

            expect(this.userStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

        });

        describe('and the upload has finished', () => {
          beforeAll(function () {
            this.xhrMock.completeUpload({ status: 200 });
            this.userStatus = this.store.getState().users.items['1'].status;
          });

          it('then the item\'s status is still FETCHING', function() {
            expect(this.userStatus.type).toEqual(FETCHING);
          });

          it('then the item\'s progressUp is updated with the current values', function() {

            expect(this.userStatus.progressUp).toEqual({
              percent: 100,
              loaded: 0,
              total: 0,
              lengthComputable: true,
            });

            expect(this.userStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

          describe('and the response is downloading', () => {
            beforeAll(function () {
              this.xhrMock.setDownloadProgress({
                lengthComputable: true,
                loaded: 13,
                total: 25
              });

              this.userStatus = this.store.getState().users.items['1'].status;
            });

            it('then the item\'s status is still FETCHING', function() {
              expect(this.userStatus.type).toEqual(FETCHING);
            });

            it('then the item\'s progressUp is updated with the current values', function() {
              expect(this.userStatus.progressUp).toEqual({
                percent: 100,
                loaded: 0,
                total: 0,
                lengthComputable: true,
              });

              expect(this.userStatus.progressDown).toEqual({
                percent: 52,
                loaded: 13,
                total: 25,
                lengthComputable: true,
              });
            });

            describe('and downloading the response is complete', () => {
              beforeAll(function () {
                return this.xhrMock.completeDownload().then(() => {
                  this.userStatus = this.store.getState().users.items['1'].status;
                });
              });

              it('then the item\'s status type is set to SUCCESS', function() {
                expect(this.userStatus.type).toEqual(SUCCESS);
              });

              it('then the item\'s progressUp status is updated with the current values', function() {
                expect(this.userStatus.progressUp).toEqual({
                  percent: 100,
                  loaded: 0,
                  total: 0,
                  lengthComputable: true,
                });

                expect(this.userStatus.progressDown).toEqual({
                  percent: 100,
                  loaded: 25,
                  total: 25,
                  lengthComputable: true,
                });
              });
            });
          });
        });
      });
    });
  });

  describe('for the fetchCollection action:', function () {
    describe('when it is NOT set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchCollection: fetchUsers } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id?',
          keyBy: 'id'
        }, {
          fetchCollection: true
        });

        this.reducers = reducers;
        this.fetchUsers = fetchUsers;
      });

      describe('and the API request succeeds', function () {
        describe('before the request has completed', function () {
          beforeAll(function() {
            fetchMock.get('http://test.com/users', new Promise(nop));

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUsers());
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the collection\'s status is FETCHING', function() {
            expect(this.store.getState().users.collections[EmptyKey].status.type).toEqual(FETCHING);
          });

          it('then there are no progress attributes on the collection\'s status object', function() {
            const userStatus = this.store.getState().users.collections[EmptyKey].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });

        describe('when the request completes', () => {
          beforeAll(function() {
            fetchMock.get('http://test.com/users', {
              body: [{ id: 1, username: 'Robert' }],
            });

            this.store = buildStore({
              users: {
                ...RESOURCES
              }
            }, { users: this.reducers } );

            this.store.dispatch(this.fetchUsers());
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then the collection\'s status is SUCCESS', function() {
            expect(this.store.getState().users.collections[EmptyKey].status.type).toEqual(SUCCESS);
          });

          it('then the collection\'s items\' status is SUCCESS', function() {
            expect(this.store.getState().users.items['1'].status.type).toEqual(SUCCESS);
          });

          it('then does not set the collection\'s progress status attributes', function() {
            const collectionStatus = this.store.getState().users.collections[EmptyKey].status;

            expect(collectionStatus.progressUp).toEqual(undefined);
            expect(collectionStatus.progressDown).toEqual(undefined);
          });

          it('then does not set then the collection\'s items\' progress status attributes', function() {
            const userStatus = this.store.getState().users.items['1'].status;

            expect(userStatus.progressUp).toEqual(undefined);
            expect(userStatus.progressDown).toEqual(undefined);
          });
        });
      });
    });

    describe('when it is set to a truthy value', function () {
      beforeAll(function () {
        const { reducers, actionCreators: { fetchCollection: fetchUsers } } = resources({
          name: 'users',
          url: 'http://test.com/users/:id?',
          keyBy: 'id'
        }, {
          fetchCollection: {
            progress: true
          }
        });

        this.reducers = reducers;
        this.fetchUsers = fetchUsers;

        XHRMock.setup();
      });

      afterAll(function() {
        XHRMock.tearDown();
      });

      describe('and the API request succeeds', function () {
        beforeAll(function () {
          this.store = buildStore({
            users: {
              ...RESOURCES,
            }
          }, { users: this.reducers } );

          this.xhrMock = XHRMock.get('http://test.com/users', {
            body: [ { id: 1, username: 'Bob' } ],
          });

          this.store.dispatch(this.fetchUsers());

          this.userCollectionStatus = this.store.getState().users.collections[EmptyKey].status;
        });

        afterAll(function() {
          XHRMock.reset();
        });

        describe('before the request has completed', function () {
          it('then the collection\'s status is FETCHING', function() {
            expect(this.userCollectionStatus.type).toEqual(FETCHING);
          });

          it('then there are no progress attributes on the collection\'s status object', function() {
            expect(this.userCollectionStatus.progressUp).toEqual(undefined);
            expect(this.userCollectionStatus.progressDown).toEqual(undefined);
          });
        });

        describe('and the request progresses', () => {
          beforeAll(function () {
            this.xhrMock.setUploadProgress({
              lengthComputable: true,
              loaded: 12,
              total: 24
            });

            this.userCollectionStatus = this.store.getState().users.collections[EmptyKey].status;
          });

          it('then the collection\'s status is still FETCHING', function() {
            expect(this.userCollectionStatus.type).toEqual(FETCHING);
          });

          it('then the collection\'s progressUp status is updated with the current values', function() {
            expect(this.userCollectionStatus.progressUp).toEqual({
              percent: 50,
              loaded: 12,
              total: 24,
              lengthComputable: true,
            });

            expect(this.userCollectionStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

        });

        describe('and the upload has finished', () => {
          beforeAll(function () {
            this.xhrMock.completeUpload({ status: 200 });
            this.userCollectionStatus = this.store.getState().users.collections[EmptyKey].status;
          });

          it('then the collection\'s status is still FETCHING', function() {
            expect(this.userCollectionStatus.type).toEqual(FETCHING);
          });

          it('then the collection\'s progressUp is updated with the current values', function() {

            expect(this.userCollectionStatus.progressUp).toEqual({
              percent: 100,
              loaded: 0,
              total: 0,
              lengthComputable: true,
            });

            expect(this.userCollectionStatus.progressDown).toEqual({
              percent: 0,
              loaded: 0,
              total: undefined,
              lengthComputable: undefined,
            });
          });

          describe('and the response is downloading', () => {
            beforeAll(function () {
              this.xhrMock.setDownloadProgress({
                lengthComputable: true,
                loaded: 13,
                total: 25
              });

              this.userCollectionStatus = this.store.getState().users.collections[EmptyKey].status;
            });

            it('then the collection\'s status is still FETCHING', function() {
              expect(this.userCollectionStatus.type).toEqual(FETCHING);
            });

            it('then the collection\'s progressUp is updated with the current values', function() {
              expect(this.userCollectionStatus.progressUp).toEqual({
                percent: 100,
                loaded: 0,
                total: 0,
                lengthComputable: true,
              });

              expect(this.userCollectionStatus.progressDown).toEqual({
                percent: 52,
                loaded: 13,
                total: 25,
                lengthComputable: true,
              });
            });

            describe('and downloading the response is complete', () => {
              beforeAll(function () {
                return this.xhrMock.completeDownload().then(() => {
                  this.userCollectionStatus = this.store.getState().users.collections[EmptyKey].status;

                  this.userStatus = this.store.getState().users.items['1'].status;
                });
              });

              it('then the collection\'s status type is set to SUCCESS', function() {
                expect(this.userCollectionStatus.type).toEqual(SUCCESS);
              });

              it('then the collection\'s items\' status is SUCCESS', function() {
                expect(this.userStatus.type).toEqual(SUCCESS);
              });

              it('then the collection\'s progressUp status is updated with the current values', function() {
                expect(this.userCollectionStatus.progressUp).toEqual({
                  percent: 100,
                  loaded: 0,
                  total: 0,
                  lengthComputable: true,
                });

                expect(this.userCollectionStatus.progressDown).toEqual({
                  percent: 100,
                  loaded: 25,
                  total: 25,
                  lengthComputable: true,
                });
              });

              it('then does not set then the collection\'s items\' progress status attributes', function() {
                expect(this.userStatus.progressUp).toEqual(undefined);
                expect(this.userStatus.progressDown).toEqual(undefined);
              });
            });
          });
        });
      });
    });
  });
});
