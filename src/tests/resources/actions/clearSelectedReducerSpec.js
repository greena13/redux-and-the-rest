import buildStore from '../../helpers/buildStore';
import { resources, SUCCESS } from '../../../index';

describe('Clear selected reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { clearSelectedUsers } } = resources({
      name: 'users',
    }, {
      clearSelected: true
    });

    this.clearSelectedUsers = clearSelectedUsers;
    this.reducers = reducers;

    this.resourceBefore = {
      items: {
        1: {
          values: {
            id: 1,
            username: 'Bob',
          },
          status: { type: SUCCESS },
        },
        2: {
          values: {
            id: 2,
            username: 'Jill',
          },
          status: { type: SUCCESS },
        }
      },
      collections: {
        '': {
          positions: [ 1, 2 ],
          status: { type: null }
        }
      },

      newItemKey: null
    };
  });

  describe('when there are no resources selected', function () {
    beforeAll(function() {
      this.store = buildStore({
        users: { ...this.resourceBefore, selectionMap: {} },
      }, { users: this.reducers } );

      this.store.dispatch(this.clearSelectedUsers());

      this.users = this.store.getState().users;
    });

    it('then does NOT change the selectionMap', function() {
      expect(this.users.selectionMap).toEqual({});
    });
  });

  describe('when there are resources selected', function () {
    beforeAll(function() {
      this.store = buildStore({
        users: { ...this.resourceBefore, selectionMap: { 1: true, 2: true }, },
      }, { users: this.reducers } );

      this.store.dispatch(this.clearSelectedUsers());

      this.users = this.store.getState().users;
    });

    it('then clears the selectionMap', function() {
      expect(this.users.selectionMap).toEqual({});
    });

    it('then DOES NOT remove the selected resources', function() {
      expect(this.users.items['1']).toEqual({
        values: {
          id: 1,
          username: 'Bob',
        },
        status: { type: SUCCESS },
      });
    });

    it('then DOES NOT remove the selected resources from collections', function() {
      expect(this.users.collections[''].positions).toEqual([ 1, 2 ]);
    });
  });
});
