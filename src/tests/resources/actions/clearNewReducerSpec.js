import buildStore from '../../helpers/buildStore';
import { resources, EDITING, NEW } from '../../../index';

describe('Clear new reducer:', function () {
  beforeAll(function () {
    const { reducers, clearNewUser } = resources({
      name: 'users',
    }, {
      clearNew: true
    });

    this.clearNewUser = clearNewUser;
    this.reducers = reducers;

    this.resourceBefore = {
      items: {
        1: {
          values: {
            id: 2,
            username: 'Jill',
          },
          status: { type: NEW },
        },
        'temp': {
          values: {
            id: 2,
            username: 'Jill',
          },
          status: { type: NEW },
        },
      },
      collections: {
        '': {
          positions: ['temp', 1],
          status: { type: EDITING },
        }
      },
      selectionMap: { temp: true, 1: true },
    };
  });

  describe('when there is NO new resource', function () {
    beforeAll(function () {
      this.store = buildStore({ users: { ...this.resourceBefore, newItemKey: null } }, { users: this.reducers } );
      this.store.dispatch(this.clearNewUser());

      this.users = this.store.getState().users;
    });

    it('then DOES NOT clear the newItemKey', function() {
      expect(this.users.newItemKey).toEqual(null);
    });

    it('then DOES NOT remove the resource\'s key from the selectionMap', function() {
      expect(this.users.selectionMap).toEqual({ temp: true, 1: true });
    });

    it('then DOES NOT remove the resource\'s key from any collections', function() {
      expect(this.users.collections[''].positions).toEqual(['temp', 1]);
    });
  });

  describe('when there is a new resource', function () {
    beforeAll(function () {
      this.store = buildStore({ users: { ...this.resourceBefore, newItemKey: 'temp' } }, { users: this.reducers } );
      this.store.dispatch(this.clearNewUser());

      this.users = this.store.getState().users;
    });

    it('then clears the newItemKey', function() {
      expect(this.users.newItemKey).toEqual(null);
    });

    it('then removes the resource\'s key from the selectionMap', function() {
      expect(this.users.selectionMap).toEqual({ 1: true });
    });

    it('then removes the resource\'s key from any collections', function() {
      expect(this.users.collections[''].positions).toEqual([1]);
    });
  });
});
