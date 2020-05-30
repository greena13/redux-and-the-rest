import fetchMock from 'fetch-mock';

import { resources, RESOURCES, SUCCESS } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';
import EmptyKey from '../../../constants/EmptyKey';

describe('hasAndBelongsToMany:', function () {
  describe('when the \'foreignKey\' option is used', function () {
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
          lists: {
            [EmptyKey]: {
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
      }, { createItem: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        hasAndBelongsToMany: {
          posts: {
            foreignKey: 'authorIdentity'
          },
        }
      }, {
        newItem: true,
      });

      this.reducers = reducers;
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

        fetchMock.post('http://test.com/posts', new Promise(nop));

        this.store.dispatch(this.posts.actionCreators.createItem('temp', {
          authorIdentity: 1,
          title: 'New Post 3'
        }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expect(this.store.getState().users.items['1'].values.postIds).toEqual([ 1, 'temp' ]);
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

        fetchMock.post('http://test.com/posts', {
          body: { id: 3, authorIdentity: 1, title: 'New Post 3' },
        });

        this.store.dispatch(this.posts.actionCreators.createItem('temp', {
          authorIdentity: 1,
          title: 'New Post 3'
        }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expect(this.store.getState().users.items['1'].values.postIds).toEqual([ 1, 3 ]);
      });
    });
  });
});
