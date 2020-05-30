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
        lists: {
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
      description: 'when the \'listParameter\' option is NOT defined',
      listParameter: undefined,
      matchingListKey: 'addressId=1',
      nonMatchingListKey: 'address=1',
    },
    {
      description: 'when the \'listParameter\' option is defined',
      listParameter: 'address',
      matchingListKey: 'address=1',
      nonMatchingListKey: 'addressId=1',
    }
  ].forEach(function({ description: listParameterDescription, listParameter, matchingListKey, nonMatchingListKey }) {
    describe(listParameterDescription, function () {
      [
        {
          description: 'and the \'dependent\' option is not defined',
          dependent: undefined,
          expectedNonMatchingList: {
            positions: [ 1 ],
            status: { type: SUCCESS },
          }
        },
        {
          description: 'and the \'dependent\' option is \'destroy\'',
          dependent: 'destroy',
          expectedNonMatchingList: {
            positions: [ ],
            status: { type: SUCCESS },
          }
        }
      ].forEach(function({ description, dependent, expectedNonMatchingList }) {

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
                  dependent,
                  listParameter
                },
              }
            }, {
              newItem: true,
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

                this.store.dispatch(this.addresses.actionCreators.destroyItem(1, { previousValues: { userId: 1, city: 'City 3' } }));
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then does NOT remove lists that contain the matching id parameter', function() {
                expect(this.store.getState().users.lists[matchingListKey]).toEqual(this.initialState.users.lists[matchingListKey]);
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
                  this.addresses.actionCreators.destroyItem(1, { previousValues: { userId: 1, city: 'City 3' } })
                );

                spyOn(console, 'warn');
              });

              afterAll(function() {
                fetchMock.restore();
                this.store = null;
              });

              it('then removes any lists that contain the matching id parameter', function() {
                expect(this.store.getState().users.lists[matchingListKey]).toEqual(undefined);
              });

              it('then does NOT remove lists that don\'t match the id parameter', function() {
                expect(this.store.getState().users.lists[nonMatchingListKey]).toEqual(expectedNonMatchingList);
              });

              it('then does NOT display a warning', function() {
                // eslint-disable-next-line no-console
                expect(console.warn).not.toHaveBeenCalledWith(
                  'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for destroyItem() to specify these values.'
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

              it('then does NOT remove lists that contain the matching id parameter', function() {
                expect(this.store.getState().users.lists[matchingListKey]).toEqual(this.initialState.users.lists[matchingListKey]);
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

              it('then removes any lists that contain the matching id parameter', function() {
                expect(this.store.getState().users.lists[matchingListKey]).toEqual(undefined);
              });

              it('then does NOT remove lists that don\'t match the id parameter', function() {
                expect(this.store.getState().users.lists[nonMatchingListKey]).toEqual(expectedNonMatchingList);
              });

              it('then displays a warning', function() {
                // eslint-disable-next-line no-console
                expect(console.warn).toHaveBeenCalledWith(
                  'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for destroyItem() to specify these values.'
                );
              });
            });
          });
        });
      });
    });
  });
});
