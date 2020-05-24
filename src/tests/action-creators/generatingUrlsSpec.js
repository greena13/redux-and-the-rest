import fetchMock from 'fetch-mock';

import buildStore from '../helpers/buildStore';
import { resources, RESOURCES, SUCCESS } from '../../index';

describe('Generating URLs:', function() {
  describe('Specifying URL for all resources actions', function () {
    beforeAll(function() {
      const {
        reducers,
        actionCreators: {
          createItem: createUser,
          fetchCollection: fetchUsers,
          fetchItem: fetchUser,
          updateItem: updateUser,
          destroyItem: destroyUser
        }
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id'
      }, {
        fetchCollection: true,
        fetchItem: true,
        update: true,
        destroy: true,
        createItem: true
      });

      this.createUser = createUser;
      this.fetchUsers = fetchUsers;
      this.fetchUser = fetchUser;
      this.updateUser = updateUser;
      this.destroyUser = destroyUser;

      this.store = buildStore({
        users: {
          ...RESOURCES,
          items: {
            1: { values: { username: 'Bob' }, status: { type: SUCCESS } }
          }
        }
      }, { users: reducers } );
    });

    it('then makes the correct API request for fetching the index', function() {
      fetchMock.get('http://test.com/users', {
        body: [ { id: 1, username: 'Bob' } ],
        status: 200
      });

      this.store.dispatch(this.fetchUsers());

      fetchMock.restore();
    });

    it('then makes the correct API request for fetching an item', function() {
      fetchMock.get('http://test.com/users/1', {
        body: { id: 1, username: 'Bob' },
        status: 200
      });

      this.store.dispatch(this.fetchUser({ id: 1 }));

      fetchMock.restore();
    });

    it('then makes the correct API request for creating a new item', function() {
      fetchMock.post('http://test.com/users', {
        body: { id: 1, username: 'Bob' },
        status: 200
      });

      this.store.dispatch(this.createUser('temp', { id: 1, username: 'Bob' }));

      fetchMock.restore();
    });

    it('then makes the correct API request for updating an item', function() {
      fetchMock.put('http://test.com/users/1', {
        body: { id: 1, username: 'Robert' },
        status: 200
      });

      this.store.dispatch(this.updateUser(1, { username: 'Robert' }));

      fetchMock.restore();
    });

    it('then makes the correct API request to destroy an item', function() {
      fetchMock.delete('http://test.com/users/1', {
        body: { },
        status: 200
      });

      this.store.dispatch(this.destroyUser(1));

      fetchMock.restore();
    });

    describe('when extra params are present', function() {
      it('then uses them as query params when fetching the index', function() {
        fetchMock.get('http://test.com/users?sandbox=true', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        this.store.dispatch(this.fetchUsers({ sandbox: true }));

        fetchMock.restore();
      });

      it('then uses them as query params when fetching an item', function() {
        fetchMock.get('http://test.com/users/1?sandbox=true', {
          body: { id: 1, username: 'Bob' },
          status: 200
        });

        this.store.dispatch(this.fetchUser({ id: 1, sandbox: true }));

        fetchMock.restore();
      });

      it('then uses them as query params when creating a new item', function() {
        fetchMock.post('http://test.com/users?sandbox=true', {
          body: { id: 1, username: 'Bob' },
          status: 200
        });

        this.store.dispatch(this.createUser({ id: 'temp', sandbox: true }, { id: 1, username: 'Bob' }));

        fetchMock.restore();
      });

      it('then uses them as query params when updating an item', function() {
        fetchMock.put('http://test.com/users/1?sandbox=true', {
          body: { id: 1, username: 'Robert' },
          status: 200
        });

        this.store.dispatch(this.updateUser({ id: 1, sandbox: true }, { username: 'Robert' }));

        fetchMock.restore();
      });

      it('then uses them as query params when destroy an item', function() {
        fetchMock.delete('http://test.com/users/1?sandbox=true', {
          body: { },
          status: 200
        });

        this.store.dispatch(this.destroyUser({ id: 1, sandbox: true }));

        fetchMock.restore();
      });
    });
  });

  describe('when the default is overridden for a particular action', function () {
    beforeAll(function() {
      const {
        reducers,
        actionCreators: { fetchCollection: fetchUsers, fetchItem: fetchUser },
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id'
      }, {
        fetchCollection: true,
        fetchItem: {
          url: 'http://test.com/guests/:order?'
        },
      });

      this.fetchUsers = fetchUsers;
      this.fetchUser = fetchUser;

      this.store = buildStore({
        users: RESOURCES
      }, { users: reducers } );
    });

    it('then uses the url for that action', function() {
      fetchMock.get('http://test.com/users', {
        body: [ { id: 1, username: 'Bob' } ],
        status: 200
      });

      this.store.dispatch(this.fetchUsers());

      fetchMock.restore();
    });

    it('then uses the default url for other actions', function() {
      fetchMock.get('http://test.com/guests/newest', {
        body: { id: 1, username: 'Bob' },
        status: 200
      });

      this.store.dispatch(this.fetchUser({ order: 'newest' }));

      fetchMock.restore();
    });
  });

});
