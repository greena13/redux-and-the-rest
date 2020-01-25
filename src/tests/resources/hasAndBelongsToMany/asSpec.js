import fetchMock from 'fetch-mock';

import { resources, RESOURCES, SUCCESS } from '../../../index';
import buildStore from '../../helpers/buildStore';

describe('hasAndBelongsToMany:', function () {
  describe('when the \'as\' option is used', function () {
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
          },
          collections: {
            '': {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: null
        },
        posts: {
          ...RESOURCES,
        }
      };
    });

    afterAll(function () {
      fetchMock.restore();
    });

    beforeAll(function () {

      /**
       * @type {{ actions, reducers, createPost }}
       */
      this.posts = resources({
        name: 'posts',
        url: 'http://test.com/posts/:id?',
        keyBy: 'id'
      }, { create: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        hasAndBelongsToMany: {
          posts: {
            ...this.posts,
            as: 'author'
          },
        }
      }, {
        new: true,
      });

      this.reducers = reducers;

      this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

      fetchMock.post('http://test.com/posts', {
        body: { id: 3, authorId: 1, title: 'New Post 3' },
      }, new Promise((resolve) => {
        this.resolveRequest = resolve;
      }));

      this.store.dispatch(this.posts.actionCreators.createPost('temp', { authorId: 1, title: 'New Post 3' }));

      this.users = this.store.getState().users;
    });

    afterAll(function() {
      fetchMock.restore();
    });

    describe('before the request has completed', function () {
      it('then uses the value of the \'as\' option to find the foreign key on the associated resource', function() {
        expect(this.users.items[1].values.postIds).toEqual([ 1, 'temp' ]);
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        this.resolveRequest();

        this.users = this.store.getState().users;
      });

      it('then uses the value of the \'as\' option to find the foreign key on the associated resource', function() {
        expect(this.users.items[1].values.postIds).toEqual([ 1, 3 ]);
      });
    });

  });
});
