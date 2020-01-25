import fetchMock from 'fetch-mock';

import { resources, NEW, SUCCESS, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';

describe('localOnly:', function () {
  beforeAll(function () {
    this.initialState = {
      users: {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob'
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
        newItemKey: 'temp'
      },
      session: {
        ...RESOURCES,
        items: {
          1: {
            values: {
              active: true
            },
            status: { type: SUCCESS }
          }
        }
      }
    };

    const { reducers: sessionReducers, actionCreators: { destroySession }, actions } = resources({
      name: 'session',
      url: 'http://test.com/session/:id',
    }, {
      destroy: true
    });

    this.sessionReducers = sessionReducers;
    this.destroySession = destroySession;
    this.sessionActions = actions;

    fetchMock.delete('http://test.com/session/1', {
      body: {
        status: 200,
        response: { }
      },
      status: 200
    });
  });

  afterAll(function () {
    fetchMock.restore();
  });

  describe('when it is not used', function () {
    beforeAll(function () {
      const {
        reducers: usersReducers,
        actionCreators: { fetchUser, fetchUsers }
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
      }, ['index', 'show', 'create', 'update', 'destroy' ]);

      this.store = buildStore({ ...this.initialState }, { users: usersReducers, session: this.sessionReducers });

      this.fetchUser = fetchUser;
      this.fetchUsers = fetchUsers;
    });

    it('then exports the fetch action creators', function() {
      expect(typeof this.fetchUser).toEqual('function');
      expect(typeof this.fetchUsers).toEqual('function');
    });
  });

  describe('when set to true', function () {
    beforeAll(function () {
      const {
        reducers: usersReducers,
        actionCreators: { fetchUser, fetchUsers, newUser, createUser, editUser, updateUser, destroyUser }
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        clearOn: this.sessionActions.destroy,
        localOnly: true,
      }, ['index', 'show', 'new', 'create', 'edit', 'update', 'destroy']);

      this.store = buildStore({ ...this.initialState }, { users: usersReducers, session: this.sessionReducers });

      this.fetchUser = fetchUser;
      this.fetchUsers = fetchUsers;
      this.createUser = createUser;
      this.newUser = newUser;
      this.editUser = editUser;
      this.updateUser = updateUser;
      this.destroyUser = destroyUser;
    });

    it('then does NOT export the fetch action creators', function() {
      expect(typeof this.fetchUser).not.toEqual('function');
      expect(typeof this.fetchUsers).not.toEqual('function');
    });

    describe('and the resource\'s CREATE action occurs WITHOUT a preceding NEW action', function () {
      beforeEach(function () {
        this.newValues = { username: 'Joseph' };
        this.store.dispatch(this.createUser('temp', this.newValues));

        this.users = this.store.getState().users;
      });

      it('then immediately adds the new resource', function() {
        expect(this.users.items.temp.values).toEqual(this.newValues);
        expect(this.users.items.temp.status.type).toEqual(SUCCESS);
      });
    });

    describe('and the resource\'s CREATE action occurs after a NEW action', function () {
      beforeEach(function () {
        this.newValues = { username: 'Joseph' };

        this.store.dispatch(this.newUser('temp', this.newValues));
        this.store.dispatch(this.createUser('temp', this.newValues));

        this.users = this.store.getState().users;
      });

      it('then immediately adds the new resource', function() {
        expect(this.users.items.temp.values).toEqual(this.newValues);
        expect(this.users.items.temp.status.type).toEqual(SUCCESS);
      });
    });

    describe('and the resource\'s UPDATE action occurs WITHOUT a preceding EDIT action', function () {
      beforeEach(function () {
        this.newValues = { username: 'Joseph' };
        this.store.dispatch(this.updateUser('1', this.newValues));

        this.users = this.store.getState().users;
      });

      it('then immediately updates the resource', function() {
        expect(this.users.items[1].values).toEqual(this.newValues);
        expect(this.users.items[1].status.type).toEqual(SUCCESS);
      });
    });

    describe('and the resource\'s UPDATE action occurs after an EDIT action', function () {
      beforeEach(function () {
        this.newValues = { username: 'Joseph' };

        this.store.dispatch(this.editUser('1', this.newValues));
        this.store.dispatch(this.updateUser('1', this.newValues));

        this.users = this.store.getState().users;
      });

      it('then immediately updates the resource', function() {
        expect(this.users.items[1].values).toEqual(this.newValues);
        expect(this.users.items[1].status.type).toEqual(SUCCESS);
      });
    });

    describe('and the resource\'s DESTROY action occurs', function () {
      beforeEach(function () {
        this.store.dispatch(this.destroyUser('1'));

        this.users = this.store.getState().users;
      });

      it('then immediately updates the resource', function() {
        expect(this.users.items[1]).not.toBeDefined();
      });
    });
  });
});
