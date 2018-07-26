import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';

describe('Generating key:', function () {
  describe('when the urlOnlyParams option is not used', function () {
    beforeAll(function () {
      const {
        reducers,
        fetchUsers,

      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id'
      }, {
        index: true,
      });

      this.fetchUsers = fetchUsers;

      this.store = buildStore({
        users: RESOURCES
      }, { users: reducers } );
    });

    describe('when no value is provided', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });
      });

      afterAll(function () {
        fetchMock.restore();
      });

      it('then uses an empty string as the key', function() {
        return this.store.dispatch(this.fetchUsers()).then(() => {
          expect(this.store.getState().users.collections['']).toEqual({
            positions: [ 1 ],
            status: { type: SUCCESS }
          });
        });
      });
    });

    describe('when an object is provided with only the id', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users/newest', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });
      });

      afterAll(function () {
        fetchMock.restore();
      });

      it('then uses the id as a key', function() {
        return this.store.dispatch(this.fetchUsers({ id: 'newest' })).then(() => {
          expect(this.store.getState().users.collections['id=newest']).toEqual({
            positions: [ 1 ],
            status: { type: SUCCESS }
          });
        });
      });
    });

    describe('when an object is provided without the id attribute', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users?order=newest&page=1', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });
      });

      afterAll(function () {
        fetchMock.restore();
      });

      it('then uses a serialised version of the object as a key', function() {
        return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 1 })).then(() => {
          expect(this.store.getState().users.collections['order=newest.page=1']).toEqual({
            positions: [ 1 ],
            status: { type: SUCCESS }
          });
        });
      });
    });
  });

  describe('when the urlParamsOnly is used', function () {
    beforeAll(function () {
      const {
        reducers,
        fetchUsers,

      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        urlOnlyParams: [ 'page' ]
      }, {
        index: true,
      });

      this.reducers = reducers;
      this.fetchUsers = fetchUsers;
    });

    describe('when an object with the attribute mentioned in urlOnlyParams is used', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users?order=newest&page=1', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
      });

      it('then does not use that attribute in the serialised object used for the key', function() {
        return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 1 })).then(() => {
          expect(this.store.getState().users.collections['order=newest']).toEqual({
            positions: [ 1 ],
            status: { type: SUCCESS }
          });
        });
      });
    });

    describe('when an object with the attribute mentioned in urlOnlyParams is used', function () {
      beforeAll(function () {
        fetchMock.get('http://test.com/users?order=newest&page=1', {
          body: [ { id: 1, username: 'Bob' } ],
          status: 200
        });

        fetchMock.get('http://test.com/users?order=newest&page=2', {
          body: [ { id: 2, username: 'Jane' } ],
          status: 200
        });

        this.store = buildStore({
          users: RESOURCES
        }, { users: this.reducers } );
      });

      afterAll(function () {
        fetchMock.restore();
      });

      it('then overrides the results for the index action', function() {
        return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 1 })).then(() => {
          return this.store.dispatch(this.fetchUsers({ order: 'newest', page: 2 })).then(() => {
            this.users = this.store.getState().users;

            expect(this.users.items).toEqual({
              1: {
                values: { id: 1, username: 'Bob' },
                status: { type: SUCCESS }
              },
              2: {
                values: { id: 2, username: 'Jane' },
                status: { type: SUCCESS }
              }
            });

            expect(this.users.collections['order=newest'].positions).toEqual([ 2 ]);
          });
        });
      });
    });
  });

});
