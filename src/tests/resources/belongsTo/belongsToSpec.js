import fetchMock from 'fetch-mock';

import { resources, NEW, SUCCESS, RESOURCES } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';
import EmptyKey from '../../../constants/EmptyKey';
import {
  expectToChangeResourcesItemValuesTo,
  expectToClearResourcesItemValues
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('belongsTo:', function () {
  describe('Given the association is one-to-one', function () {
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

            2: {
              values: {
                id: 2,
                username: 'Rupert',
              },
              status: { type: SUCCESS }
            },

            temp: {
              values: {
                username: 'Jane',
              },
              status: { type: NEW }
            }
          },
          lists: {
            [EmptyKey]: {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: 'temp'
        },
        addresses: {
          ...RESOURCES,
          items: {
            1: {
              values: {
                city: 'City 1',
                userId: 1
              },
              status: { type: SUCCESS }
            }
          }
        }
      };
    });

    afterAll(function () {
      fetchMock.restore();
    });

    beforeAll(function () {

      /**
       * @type {{actions, reducers, createAddress, updateAddress, destroyAddress}} resources
       */
      this.addresses = resources({
        name: 'addresses',
        url: 'http://test.com/addresses/:id?',
        keyBy: 'id'
      }, { createItem: true, updateItem: true, destroyItem: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: ['address']
      }, {
        fetchList: true,
        newItem: true,
      });

      this.reducers = reducers;
    });

    describe('when the association\'s CREATE action occurs', function () {
      describe('and the request has yet to complete', function () {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.post('http://test.com/addresses', new Promise(nop));

          this.store.dispatch(this.addresses.actionCreators.createItem('temp', { userId: 1, city: 'New City 3' }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then sets the new association to the default attribute', function() {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 'temp');
        });
      });

      describe('and the request has completed', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.post('http://test.com/addresses', {
            body: { id: 3, userId: 1, city: 'New City 3' },
          });

          this.store.dispatch(this.addresses.actionCreators.createItem('temp', { userId: 1, city: 'New City 3' }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then updates the key of the association', function() {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 3);
        });
      });
    });

    describe('and the association\'s UPDATE action occurs', function () {
      describe('and the previous values have been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userId: 2
            }, { previousValues: {
                city: 'City 1',
                userId: 1
              }
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '2', 'addressId');
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', {
              body: {
                city: 'City 1',
                userId: 2
              },
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userId: 2
            }, { previousValues: {
                city: 'City 1',
                userId: 1
              }
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item from old associated items', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });

          it('then adds the associated item to new associated items', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '2', 'addressId', 1);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userId: 2
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', {
              body: {
                city: 'City 1',
                userId: 2
              }
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userId: 2
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: UPDATE_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for updateItem() to specify these values.'
            );
          });

          it('then removes the associated item from old associated items', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });

          it('then adds the associated item to new associated items', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '2', 'addressId', 1);
          });
        });
      });

    });

    describe('and the association\'s DESTROY action occurs', function () {
      describe('and the previous values have been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1, { previousValues: {
              city: 'City 1',
              userId: 1
             } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', {
              body: {},
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1, { previousValues: {
              city: 'City 1',
              userId: 1
             } }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', {
              body: {},
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for destroyItem() to specify these values.'
            );
          });

          it('then removes the associated item', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });
        });
      });

    });

  });

  describe('when the association is one-to-many', function () {
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

            2: {
              values: {
                id: 2,
                username: 'Rupert',
              },
              status: { type: SUCCESS }
            },

            temp: {
              values: {
                username: 'Jane',
              },
              status: { type: NEW }
            }
          },
          lists: {
            [EmptyKey]: {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: 'temp'
        },
        addresses: {
          ...RESOURCES,
          items: {
            1: {
              values: {
                city: 'City 1',
                userIds: [ 1 ]
              },
              status: { type: SUCCESS }
            }
          }
        }
      };
    });

    afterAll(function () {
      fetchMock.restore();
    });

    beforeAll(function () {
      this.addresses = resources({
        name: 'addresses',
        url: 'http://test.com/addresses/:id?',
        keyBy: 'id'
      }, { createItem: true, updateItem: true, destroyItem: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: ['addresses']
      }, {
        fetchList: true,
        newItem: true,
      });

      this.reducers = reducers;
    });

    describe('and the association\'s CREATE action occurs', function () {
      describe('and the request has yet to complete', function () {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.post('http://test.com/addresses', new Promise(nop));

          this.store.dispatch(this.addresses.actionCreators.createItem('temp', { userIds: [ 1 ], city: 'New City 3' }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then adds the new association to the default attribute', function() {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 'temp');
        });
      });

      describe('and the request has completed', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.post('http://test.com/addresses', {
            body: { id: 3, userIds: [1], city: 'New City 3' },
          });

          this.store.dispatch(this.addresses.actionCreators.createItem('temp', { userIds: [ 1 ], city: 'New City 3' }));
        });

        afterAll(function() {
          fetchMock.restore();
          this.store = null;
        });

        it('then updates the key of the association', function() {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 3);
        });
      });
    });

    describe('and the association\'s UPDATE action occurs', function () {
      describe('and the previous values have been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userIds: [ 2 ]
            }, { previousValues: {
                city: 'City 1',
                userIds: [ 1 ]
              }
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '2', 'addressId');
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', {
              body: {
                city: 'City 1',
                userIds: [2]
              }
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userIds: [ 2 ]
            }, { previousValues: {
                city: 'City 1',
                userIds: [ 1 ]
              }
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item from old associated items', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });

          it('then adds the associated item to new associated items', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '2', 'addressId', 1);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userIds: [ 2 ]
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.put('http://test.com/addresses/1', {
                  body: {
                    city: 'City 1',
                    userIds: [2]
                  },
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.updateItem(1, {
              city: 'City 1',
              userIds: [ 2 ]
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: UPDATE_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for updateItem() to specify these values.'
            );
          });

          it('then removes the associated item from old associated items', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });

          it('then adds the associated item to new associated items', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '2', 'addressId', 1);
          });
        });
      });

    });

    describe('and the association\'s DESTROY action occurs', function () {
      describe('and the previous values have been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1, { previousValues: {
                city: 'City 1',
                userIds: [ 1 ]
               }
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function() {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', {
                  body: {},
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1, { previousValues: {
                city: 'City 1',
                userIds: [ 1 ]
               }
            }));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        describe('and the request has yet to complete', function () {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', new Promise(nop));

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then does NOT remove the associated item', function () {
            expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

            fetchMock.delete('http://test.com/addresses/1', {
                  body: {},
            });

            spyOn(console, 'warn');

            this.store.dispatch(this.addresses.actionCreators.destroyItem(1));
          });

          afterAll(function() {
            fetchMock.restore();
            this.store = null;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for destroyItem() to specify these values.'
            );
          });

          it('then removes the associated item', function() {
            expectToClearResourcesItemValues(this, RESOURCE_NAME, '1', 'addressId');
          });
        });
      });
    });
  });
});
