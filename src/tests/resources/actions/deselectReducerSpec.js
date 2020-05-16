import { resources, SUCCESS } from '../../../index';
import { expectToChangeSelectionMapTo, setupInitialState } from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Deselect reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { deselectUser } } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      deselect: true
    });

    this.reducers = reducers;
    this.deselectUser = deselectUser;
  });

  describe('when the resource is in the store', function () {
    describe('and there are no resources selected', function () {
      expectToCorrectlyDeselectItem({ before: { }, after: { } });
    });

    describe('and there are resources selected using the default value of true', function () {
      expectToCorrectlyDeselectItem(
        { before: { 1: true, 2: true }, after: { 2: true } },
        1
      );
    });

    describe('and there are resources selected using custom values', function () {
      expectToCorrectlyDeselectItem(
        { before: { 1: { role: 'admin' }, 2: { role: 'admin' } }, after: { 2: { role: 'admin' } } },
        1
      );
    });
  });

  describe('and the item\'s id is passed as an object to the action creator', function () {
    describe('and there are resources selected using custom values', function () {
      expectToCorrectlyDeselectItem(
        { before: { 1: { role: 'admin' }, 2: { role: 'admin' } }, after: { 2: { role: 'admin' } } },
        { id: 1 }
      );
    });
  });

  function expectToCorrectlyDeselectItem({ before, after }, id) {
    beforeAll(function () {
      setupState(this, {
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
        newItemKey: null,
        selectionMap: before
      }, id);
    });

    it('then removes the resource\'s key from the selectionMap', function() {
      expectToChangeSelectionMapTo(this, RESOURCE_NAME, after);
    });
  }

  function setupState(context, initialState, id) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.deselectUser(id));
  }
});
