import buildStore from '../../helpers/buildStore';
import { resources, SUCCESS } from '../../../index';

describe('Deselect reducer:', function () {
  beforeAll(function () {
    const { reducers, deselectUser } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      deselect: true
    });

    this.reducers = reducers;
    this.deselectUser = deselectUser;

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
      collections: {},
      newItemKey: null
    };

  });

  describe('when the resource is in the store', function () {
    [
      {
        description: 'and there are no resources selected',
        valueBefore: { },
        expectedValue: { }
      },
      {
        description: 'and there are resources selected using the default context value of true',
        valueBefore: { 1: true, 2: true },
        expectedValue: { 2: true }
      },
      {
        description: 'and there are resources selected using custom context values',
        valueBefore: { 1: { role: 'admin' }, 2: { role: 'admin' } },
        expectedValue: { 2: { role: 'admin' } }
      },
    ].forEach(({ description, valueBefore, expectedValue }) => {
      describe(description, function () {
        beforeAll(function () {
          this.store = buildStore({ users: { ...this.resourceBefore, selectionMap: valueBefore } }, { users: this.reducers } );

          this.store.dispatch(this.deselectUser(1));
          this.users = this.store.getState().users;
        });

        it('then removes the resource\'s key from the selectionMap', function() {
          expect(this.users.selectionMap).toEqual(expectedValue);
        });
      });
    });
  });

  describe('and the item\'s id is passed as an object to the action creator', function () {
    [
      {
        description: 'and there are resources selected using custom context values',
        valueBefore: { 1: { role: 'admin' }, 2: { role: 'admin' } },
        expectedValue: { 2: { role: 'admin' } }
      },
    ].forEach(({ description, valueBefore, expectedValue }) => {
      describe(description, function () {
        beforeAll(function () {
          this.store = buildStore({ users: { ...this.resourceBefore, selectionMap: valueBefore } }, { users: this.reducers } );

          this.store.dispatch(this.deselectUser({ id: 1 }));
          this.users = this.store.getState().users;
        });

        it('then removes the resource\'s key from the selectionMap', function() {
          expect(this.users.selectionMap).toEqual(expectedValue);
        });
      });
    });
  });
});
