import fetchMock from 'fetch-mock';
import { resources, RESOURCES, SUCCESS } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';
import EmptyKey from '../../../constants/EmptyKey';

describe('belongsTo:', function () {
  beforeAll(function () {
    this.initialState = {
      users: {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob',
              addressId: 1
            },
            status: { type: SUCCESS }
          },
        },
        collections: {
          [EmptyKey]: {
            positions: [ 1 ],
            status: { type: SUCCESS },
          },
          'addressId=1': {
            positions: [ 1 ],
            status: { type: SUCCESS },
          },
          'address=1': {
            positions: [ 1 ],
            status: { type: SUCCESS },
          }
        },
        selectionMap: { 1: true },
        newItemKey: null
      },
      addresses: {
        ...RESOURCES,
        items: {
          1: {
            values: {
              userId: 1
            },
            status: { type: SUCCESS }
          }
        }
      }
    };
  });

  [
    {
      description: 'when the \'collectionParameter\' option is NOT defined',
      collectionParameter: undefined,
      matchingCollectionKey: 'addressId=1',
      nonMatchingCollectionKey: 'address=1',
    },
    {
      description: 'when the \'collectionParameter\' option is defined',
      collectionParameter: 'address',
      matchingCollectionKey: 'address=1',
      nonMatchingCollectionKey: 'addressId=1',
    }
  ].forEach(function({ description: collectionParameterDescription, collectionParameter, matchingCollectionKey, nonMatchingCollectionKey }) {
    describe(collectionParameterDescription, function () {
      [
        {
          description: 'and the \'dependent\' option is not defined',
          dependent: undefined,
          expectedNonMatchingCollection: {
            positions: [ 1 ],
            status: { type: SUCCESS },
          }
        },
        {
          description: 'and the \'dependent\' option is \'destroy\'',
          dependent: 'destroy',
          expectedNonMatchingCollection: {
            positions: [ ],
            status: { type: SUCCESS },
          }
        }
      ].forEach(function({ description, dependent, expectedNonMatchingCollection }) {

        describe(description, function () {
          beforeAll(function () {

            /**
             * @type {{ actions, reducers, destroyAddress }}
             */
            this.addresses = resources({
              name: 'addresses',
              url: 'http://test.com/addresses/:id?',
              keyBy: 'id'
            }, { destroyItem: true });

            const {
              reducers,
            } = resources({
              name: 'users',
              url: 'http://test.com/users/:id?',
              keyBy: 'id',
              belongsTo: {
                addresses: {
                  ...this.addresses,
                  dependent,
                  collectionParameter
                },
              }
            }, {
              new: true,
            });

            this.reducers = reducers;
          });

          describe('and the previous values are included in the destroyItem action', function () {
            describe('before a request to destroy an associated resource item has completed', function () {
              beforeAll(function () {
                fetchMock.delete('http://test.com/addresses/1', new Promise(nop));

                this.store = buildStore({ ...this.initialState }, {
                  users: this.reducers,
                  addresses: this.addresses.reducers
                });

                this.store.dispatch(this.addresses.actionCreators.destroyItem(1, { userId: 1, city: 'City 3' }));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then does NOT remove collections that contain the matching id parameter', function() {
                expect(this.store.getState().users.collections[matchingCollectionKey]).toEqual(this.initialState.users.collections[matchingCollectionKey]);
              });
            });

            describe('after a request to destroy an associated resource item has completed', () => {
              beforeAll(function () {
                fetchMock.delete('http://test.com/addresses/1', {
                  body: {},
                });

                this.store = buildStore({ ...this.initialState }, {
                  users: this.reducers,
                  addresses: this.addresses.reducers
                });

                this.store.dispatch(
                  this.addresses.actionCreators.destroyItem(1, { userId: 1, city: 'City 3' })
                );

                spyOn(console, 'warn');
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then removes any collections that contain the matching id parameter', function() {
                expect(this.store.getState().users.collections[matchingCollectionKey]).toEqual(undefined);
              });

              it('then does NOT remove collections that don\'t match the id parameter', function() {
                expect(this.store.getState().users.collections[nonMatchingCollectionKey]).toEqual(expectedNonMatchingCollection);
              });

              it('then does NOT display a warning', function() {
                // eslint-disable-next-line no-console
                expect(console.warn).not.toHaveBeenCalledWith(
                  'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Provide the values of the item you are destroying as the second argument to destroyItem().'
                );
              });
            });
          });

          describe('and the previous values are NOT included in the destroyItem action', function () {
            describe('before a request to destroy an associated resource item has completed', function () {
              beforeAll(function () {
                fetchMock.delete('http://test.com/addresses/1', new Promise(nop));

                this.store = buildStore({ ...this.initialState }, {
                  users: this.reducers,
                  addresses: this.addresses.reducers
                });

                this.store.dispatch(this.addresses.actionCreators.destroyItem(1));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then does NOT remove collections that contain the matching id parameter', function() {
                expect(this.store.getState().users.collections[matchingCollectionKey]).toEqual(this.initialState.users.collections[matchingCollectionKey]);
              });
            });

            describe('after a request to destroy an associated resource item has completed', () => {
              beforeAll(function () {
                fetchMock.delete('http://test.com/addresses/1', {
                  body: {},
                });

                this.store = buildStore({ ...this.initialState }, {
                  users: this.reducers,
                  addresses: this.addresses.reducers
                });

                spyOn(console, 'warn');

                this.store.dispatch(this.addresses.actionCreators.destroyItem(1));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then removes any collections that contain the matching id parameter', function() {
                expect(this.store.getState().users.collections[matchingCollectionKey]).toEqual(undefined);
              });

              it('then does NOT remove collections that don\'t match the id parameter', function() {
                expect(this.store.getState().users.collections[nonMatchingCollectionKey]).toEqual(expectedNonMatchingCollection);
              });

              it('then displays a warning', function() {
                // eslint-disable-next-line no-console
                expect(console.warn).toHaveBeenCalledWith(
                  'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Provide the values of the item you are destroying as the second argument to destroyItem().'
                );
              });
            });
          });
        });
      });
    });
  });
});
