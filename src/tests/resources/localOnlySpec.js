import { resources, SUCCESS } from '../../index';
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
      }
    };
  });

  describe('Given the localOnly option is NOT set', function () {
    beforeAll(function () {
      const {
        reducers: usersReducers,
        actionCreators: { fetchUser, fetchUsers }
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
      }, ['index', 'show', 'create', 'update', 'destroy' ]);

      this.store = buildStore({ ...this.initialState }, { users: usersReducers });

      this.fetchUser = fetchUser;
      this.fetchUsers = fetchUsers;
    });

    it('then exports the fetch action creators', function() {
      expect(typeof this.fetchUser).toEqual('function');
      expect(typeof this.fetchUsers).toEqual('function');
    });
  });

  describe('Given the localOnly option is set to true', function () {
    beforeAll(function () {
      spyOn(console, 'warn');

      const {
        reducers: usersReducers,
        actionCreators: { fetchUser, fetchUsers, newUser, createUser, editUser, updateUser, destroyUser }
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        localOnly: true,
      }, ['index', 'show', 'new', 'create', 'edit', 'update', 'destroy']);

      this.store = buildStore({ ...this.initialState }, { users: usersReducers });

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

    it('then warns about some actions being incompatible with the option', function() {
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: Action \'index\' is not compatible with the localOnly option.'
      );

      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: Action \'show\' is not compatible with the localOnly option.'
      );
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
        expect(this.users.items['1'].values).toEqual({ ...this.initialState.users.items['1'].values, ...this.newValues });
        expect(this.users.items['1'].status.type).toEqual(SUCCESS);
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
        expect(this.users.items['1'].values).toEqual({ ...this.initialState.users.items['1'].values, ...this.newValues });
        expect(this.users.items['1'].status.type).toEqual(SUCCESS);
      });
    });

    describe('and the resource\'s DESTROY action occurs', function () {
      beforeEach(function () {
        this.store.dispatch(this.destroyUser('1'));

        this.users = this.store.getState().users;
      });

      it('then immediately updates the resource', function() {
        expect(this.users.items['1']).not.toBeDefined();
      });
    });
  });
});
