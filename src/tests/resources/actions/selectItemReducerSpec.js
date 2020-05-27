import { RESOURCES, resources, SUCCESS } from '../../../index';
import {
  expectToChangeSelectionMapTo,
  expectToNotChangeSelectionMap,
  setupInitialState
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Select another reducer:', function () {
  beforeAll(function () {
    const { reducers, actionCreators: { selectItem: selectUser } } = resources({
      name: 'users',
    }, {
      selectItem: true
    });

    this.selectUser = selectUser;
    this.reducers = reducers;

    this.resourceBefore = {

      lists: {},
      newItemKey: null
    };
  });

  describe('when the resource is not in the store', function () {
    beforeAll(function () {
      spyOn(console, 'warn');

      setupState(this, {}, 3);
    });

    it('then warns about the resource not being in the store', function() {
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'Redux and the REST: selectMap is not intended to hold references to items that are not in the store. SELECT_USER\'s key \'3\' did not match any of the item keys: 1, 2. Check the options passed to selectItem(). (The selection was ignored.)'
      );
    });

    it('then does not change selectionMap', function() {
      expectToNotChangeSelectionMap(this, RESOURCE_NAME);
    });
  });

  describe('when the resource is in the store', function () {
    describe('and there are no resources already selected', function () {
      beforeAll(function () {
        this.nextSelected = 1;

        setupState(this, {}, this.nextSelected);
      });

      it('then add the item to the selectionMap', function() {
        expectToChangeSelectionMapTo(this, RESOURCE_NAME, { [this.nextSelected]: true });
      });
    });

    describe('and there is already resources selected', function () {
      beforeAll(function () {
        this.nextSelected = 1;
        this.previouslySelected = 2;

        setupState(this, { [this.previouslySelected]: true }, this.nextSelected);
      });

      it('then adds the newly selected item to those already selected', function() {
        expectToChangeSelectionMapTo(this, RESOURCE_NAME, { [this.nextSelected]: true });
      });
    });
  });

  describe('when the item\'s id is passed as an object to the action creator', function () {
    beforeAll(function () {
      this.nextSelected = 1;

      setupState(this, {}, { id: this.nextSelected });
    });

    it('then add the item to the selectionMap', function() {
      expectToChangeSelectionMapTo(this, RESOURCE_NAME, { [this.nextSelected]: true });
    });
  });

  function setupState(context, selectionMap, params) {
    setupInitialState(context, RESOURCE_NAME, {
      ...RESOURCES,
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
      selectionMap
    });

    context.store.dispatch(context.selectUser(params));
  }
});
