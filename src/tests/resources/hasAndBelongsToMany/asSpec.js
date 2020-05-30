import fetchMock from 'fetch-mock';

import { resources, RESOURCES, SUCCESS } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';
import EmptyKey from '../../../constants/EmptyKey';
import { expectToChangeResourcesItemValuesTo } from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

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
            as: 'author'
          },
        }
      }, {
        newItem: true,
      });

      this.reducers = reducers;
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        fetchMock.post('http://test.com/posts', new Promise(nop));

        this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

        this.store.dispatch(this.posts.actionCreators.createItem('temp', { authorId: 1, title: 'New Post 3' }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'as\' option to find the foreign key on the associated resource', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'postIds', [ 1, 'temp' ]);
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        fetchMock.post('http://test.com/posts', {
              body: { id: 3, authorId: 1, title: 'New Post 3' },
        });

        this.store = buildStore({ ...this.initialState }, { users: this.reducers, posts: this.posts.reducers });

        this.store.dispatch(this.posts.actionCreators.createItem('temp', { authorId: 1, title: 'New Post 3' }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'as\' option to find the foreign key on the associated resource', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'postIds', [ 1, 3 ]);
      });
    });

  });
});
