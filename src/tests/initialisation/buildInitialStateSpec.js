import { resources } from '../../index';
import { SUCCESS } from '../../constants/Statuses';
import { COMPLETE } from '../../constants/MetadataTypes';
import { RESOURCES } from '../../constants/DataStructures';
import EmptyKey from '../../constants/EmptyKey';

describe('buildInitialState:', function() {
  describe('Given a resource has been defined with no special options,', () => {
    beforeAll(function () {
      const { buildInitialState } = resources({
        name: 'users',
        url: 'http://test.com/users/:id',
      }, ['fetchItem']);

      this.buildInitialState = buildInitialState;
    });

    describe('when the initial state builder is instantiated with a list of items', () => {
      it('then correctly builds those items', function() {
        const stateBuilder = this.buildInitialState([ { id: 1, username: 'John' }]);

        expect(stateBuilder.build()).toEqual({
          ...RESOURCES,
          items: {
            '1': {
              values: {
                id: 1,
                username: 'John'
              },
              status: {
                type: SUCCESS
              },
              metadata: {
                type: COMPLETE
              }
            }
          },
          collections: {
            [EmptyKey]: {
              positions: [1],
              status: {
                type: SUCCESS
              },
              metadata: {
                type: COMPLETE
              }
            }
          }
        });
      });
    });

    describe('when the initial state builder is instantiated and then passed a collection', () => {
      it('then correctly builds those items', function() {
        const stateBuilder = this.buildInitialState();
        stateBuilder.addCollection([ { id: 1, username: 'John' }]);

        expect(stateBuilder.build()).toEqual({
          ...RESOURCES,
          items: {
            '1': {
              values: {
                id: 1,
                username: 'John'
              },
              status: {
                type: SUCCESS
              },
              metadata: {
                type: COMPLETE
              }
            }
          },
          collections: {
            [EmptyKey]: {
              positions: [1],
              status: {
                type: SUCCESS
              },
              metadata: {
                type: COMPLETE
              }
            }
          }
        });
      });
    });

    describe('when the initial state builder is instantiated and then passed an item', () => {
      it('then correctly builds those items as outside any collection', function() {
        const stateBuilder = this.buildInitialState();
        stateBuilder.addItem({ id: 1, username: 'John' });

        expect(stateBuilder.build()).toEqual({
          ...RESOURCES,
          items: {
            '1': {
              values: {
                id: 1,
                username: 'John'
              },
              status: {
                type: SUCCESS
              },
              metadata: {
                type: COMPLETE
              }
            }
          }
        });
      });
    });

    describe('when the status type is set only on the resource', () => {
      it('then correctly inherits that status type for all items and collections', function() {
        const stateBuilder = this.buildInitialState();
        stateBuilder.addCollection([{ id: 1, username: 'John' }]);

        const customStatusType = 'CUSTOM';

        stateBuilder.setStatusType(customStatusType);
        const results = stateBuilder.build();

        expect(results.collections[EmptyKey].status.type).toEqual(customStatusType);
        expect(results.items['1'].status.type).toEqual(customStatusType);
      });
    });

    describe('when the status type is set only on the collection', () => {
      it('then correctly inherits that status type for all items and collections', function() {
        const stateBuilder = this.buildInitialState();
        const customStatusType = 'CUSTOM';

        stateBuilder.addCollection([{ id: 1, username: 'John' }]).setStatusType(customStatusType);

        const results = stateBuilder.build();

        expect(results.collections[EmptyKey].status.type).toEqual(customStatusType);
        expect(results.items['1'].status.type).toEqual(customStatusType);
      });
    });

    describe('when the status type is set only on the item', () => {
      it('then correctly applies the status type only to the item', function() {
        const stateBuilder = this.buildInitialState();
        const customStatusType = 'CUSTOM';

        stateBuilder.addCollection([]);
        stateBuilder.addItem({ id: 1, username: 'John' }).setStatusType(customStatusType);

        const results = stateBuilder.build();

        expect(results.collections[EmptyKey].status.type).toEqual(SUCCESS);
        expect(results.items['1'].status.type).toEqual(customStatusType);
      });
    });

    describe('when the status type is set on the resource and the collection', () => {
      it('then correctly applies the collection\'s status type to the collection and item', function() {
        const collectionStatus = 'COLLECTION_STATUS';
        const resourceStatusType = 'RESOURCE_STATUS';

        const stateBuilder = this.buildInitialState().setStatusType(resourceStatusType);
        stateBuilder.addCollection([{ id: 1, username: 'John' }]).setStatusType(collectionStatus);

        const results = stateBuilder.build();

        expect(results.collections[EmptyKey].status.type).toEqual(collectionStatus);
        expect(results.items['1'].status.type).toEqual(collectionStatus);
      });
    });

    describe('when the status type is set on the collection and the item', () => {
      it('then correctly applies status types to the collection and item', function() {
        const collectionStatus = 'COLLECTION_STATUS';
        const itemStatus = 'ITEM_STATUS';

        const stateBuilder = this.buildInitialState();
        const collectionBuilder = stateBuilder.addCollection([{ id: 1, username: 'John' }]).setStatusType(collectionStatus);
        collectionBuilder.addItem({ id: 2, username: 'Bob' }).setStatusType(itemStatus);

        const results = stateBuilder.build();

        expect(results.collections[EmptyKey].status.type).toEqual(collectionStatus);
        expect(results.items['1'].status.type).toEqual(collectionStatus);

        expect(results.items['2'].status.type).toEqual(itemStatus);
      });
    });
  });
});
