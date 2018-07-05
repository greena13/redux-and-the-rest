import fetchMock from 'fetch-mock';

import { resources, NEW, SUCCESS, RESOURCES } from '../../../index';
import buildStore from '../../helpers/buildStore';

describe('hasAndBelongsToMany:', function () {
  describe('when the association is many-to-one', function () {
    beforeAll(function () {
      this.initialState = {
        users: {
          items: {
            1: {
              values: {
                id: 1,
                username: 'Bob',
                postIds: [ 1 ]
              },
              status: { type: SUCCESS }
            },

            2: {
              values: {
                id: 2,
                username: 'Rupert',
              },
              status: { type: SUCCESS }
            },

            temp: {
              values: {
                username: 'Jane',
              },
              status: { type: NEW }
            }
          },
          collections: {
            '': {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: 'temp'
        },
        posts: {
          ...RESOURCES,
          items: {
            1: {
              values: {
                title: 'Post 1',
                userId: 1
              },
              status: { type: SUCCESS }
            }
          }
        }
      };
    });

    afterAll(function () {
      fetchMock.restore();
    });

    beforeAll(function () {
      this.posts = resources({
        name: 'posts',
        url: 'http://test.com/posts/:id?',
        keyBy: 'id'
      }, { create: true, update: true, destroy: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        hasAndBelongsToMany: {
          posts: this.posts
        }
      }, {
        index: true,
        new: true,
      });

      this.reducers = reducers;
    });

    describe('and the association\'s CREATE action occurs', function () {
      beforeAll(function () {
        this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

        fetchMock.post('http://test.com/posts', {
          body: { id: 3, userId: 1, title: 'New Post 3' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.posts.createPost('temp', { userId: 1, title: 'New Post 3' }));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then adds the new association to the default attribute', function() {
          expect(this.users.items[1].values.postIds).toEqual([ 1, 'temp' ]);
        });
      });

      describe('and the request has completed', () => {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then updates the key of the association', function() {
          expect(this.users.items[1].values.postIds).toEqual([ 1, 3 ]);
        });
      });

    });

    describe('and the association\'s UPDATE action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.put('http://test.com/posts/1', {
            body: {
              title: 'Post 1',
              userId: 2
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.updatePost(1, {
            title: 'Post 1',
            userId: 2
          }, {
            title: 'Post 1',
            userId: 1
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
            expect(this.users.items[2].values.postIds).toEqual(undefined);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.postIds).toEqual([ 1 ]);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.put('http://test.com/posts/1', {
            body: {
              title: 'Post 1',
              userId: 2
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.updatePost(1, {
            title: 'Post 1',
            userId: 2
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: UPDATE_POST did no specify any previous values. This makes updating \'users.postIds\' much less efficient. Provide the values of the item you are destroying as the third argument to update*().'
            );
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.postIds).toEqual([ 1 ]);
          });
        });
      });

    });

    describe('and the association\'s DESTROY action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.delete('http://test.com/posts/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.destroyPost(1, {
            title: 'Post 1',
            userId: 1
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.delete('http://test.com/posts/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.destroyPost(1));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: DESTROY_POST did no specify any previous values. This makes updating \'users.postIds\' much less efficient. Provide the values of the item you are destroying as the second argument to destroy*().'
            );
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });
        });
      });

    });

  });

  describe('when the association is many-to-many', function () {
    beforeAll(function () {
      this.initialState = {
        users: {
          items: {
            1: {
              values: {
                id: 1,
                username: 'Bob',
                postIds: [ 1 ]
              },
              status: { type: SUCCESS }
            },

            2: {
              values: {
                id: 2,
                username: 'Rupert',
              },
              status: { type: SUCCESS }
            },

            temp: {
              values: {
                username: 'Jane',
              },
              status: { type: NEW }
            }
          },
          collections: {
            '': {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: 'temp'
        },
        posts: {
          ...RESOURCES,
          items: {
            1: {
              values: {
                title: 'Post 1',
                userIds: [ 1 ]
              },
              status: { type: SUCCESS }
            }
          }
        }
      };
    });

    afterAll(function () {
      fetchMock.restore();
    });

    beforeAll(function () {

      /**
       *
       * @type {{actions, reducers, createPost, updatePost, destroyPost }}
       */
      this.posts = resources({
        name: 'posts',
        url: 'http://test.com/posts/:id?',
        keyBy: 'id'
      }, { create: true, update: true, destroy: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        hasAndBelongsToMany: {
          posts: {
            ...this.posts,
          },
        }
      }, {
        index: true,
        new: true,
      });

      this.reducers = reducers;
    });

    describe('and the association\'s CREATE action occurs', function () {
      beforeAll(function () {
        this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

        fetchMock.post('http://test.com/posts', {
          body: { id: 3, userIds: [ 1 ], title: 'New Post 3' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.posts.createPost('temp', { userIds: [ 1 ], title: 'New Post 3' }));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then adds the new association to the default attribute', function() {
          expect(this.users.items[1].values.postIds).toEqual([ 1, 'temp' ]);
        });
      });

      describe('and the request has completed', () => {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then updates the key of the association', function() {
          expect(this.users.items[1].values.postIds).toEqual([ 1, 3 ]);
        });
      });

    });

    describe('and the association\'s UPDATE action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.put('http://test.com/posts/1', {
            body: {
              title: 'Post 1',
              userIds: [ 2 ]
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.updatePost(1, {
            title: 'Post 1',
            userIds: [ 2 ]
          }, {
            title: 'Post 1',
            userIds: [ 1 ]
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
            expect(this.users.items[2].values.postIds).toEqual(undefined);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.postIds).toEqual([ 1 ]);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.put('http://test.com/posts/1', {
            body: {
              title: 'Post 1',
              userIds: [ 2 ]
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.updatePost(1, {
            title: 'Post 1',
            userIds: [ 2 ]
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: UPDATE_POST did no specify any previous values. This makes updating \'users.postIds\' much less efficient. Provide the values of the item you are destroying as the third argument to update*().'
            );
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.postIds).toEqual([ 1 ]);
          });
        });
      });

    });

    describe('and the association\'s DESTROY action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.delete('http://test.com/posts/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.destroyPost(1, {
            title: 'Post 1',
            userIds: [ 1 ]
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

          fetchMock.delete('http://test.com/posts/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.posts.destroyPost(1));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ 1 ]);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: DESTROY_POST did no specify any previous values. This makes updating \'users.postIds\' much less efficient. Provide the values of the item you are destroying as the second argument to destroy*().'
            );
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.postIds).toEqual([ ]);
          });
        });
      });

    });

  });
});
