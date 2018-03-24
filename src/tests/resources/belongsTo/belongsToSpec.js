import fetchMock from 'fetch-mock';

import { NEW, SUCCESS } from '../../../constants/Statuses';
import resources from '../../../resources';
import buildStore from '../../helpers/buildStore';
import { RESOURCES } from '../../../constants/DataStructures';

describe('belongsTo:', function () {
  describe('when the association is one-to-one', function () {
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
          collections: {
            '': {
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
      }, { create: true, update: true, destroy: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: {
          address: this.addresses
        }
      }, {
        index: true,
        new: true,
      });

      this.reducers = reducers;
    });

    describe('and the association\'s CREATE action occurs', function () {
      beforeAll(function () {
        this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

        fetchMock.post('http://test.com/addresses', {
          body: { id: 3, userId: 1, city: 'New City 3' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.addresses.createAddress('temp', { userId: 1, city: 'New City 3' }));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then sets the new association to the default attribute', function() {
          expect(this.users.items[1].values.addressId).toEqual('temp');
        });
      });

      describe('and the request has completed', () => {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then updates the key of the association', function() {
          expect(this.users.items[1].values.addressId).toEqual(3);
        });
      });

    });

    describe('and the association\'s UPDATE action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.put('http://test.com/addresses/1', {
            body: {
              city: 'City 1',
              userId: 2
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.updateAddress(1, {
            city: 'City 1',
            userId: 2
          }, {
            city: 'City 1',
            userId: 1
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
            expect(this.users.items[2].values.addressId).toEqual(undefined);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.addressId).toEqual(1);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.put('http://test.com/addresses/1', {
            body: {
              city: 'City 1',
              userId: 2
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.updateAddress(1, {
            city: 'City 1',
            userId: 2
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: UPDATE_ADDRESS did no specify any previous values. This makes updating \'users.addressId\' much less efficient. Provide the values of the item you are destroying as the third argument to update*().'
            );
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.addressId).toEqual(1);
          });
        });
      });

    });

    describe('and the association\'s DESTROY action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.delete('http://test.com/addresses/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.destroyAddress(1, {
            city: 'City 1',
            userId: 1
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.delete('http://test.com/addresses/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.destroyAddress(1));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: DESTROY_ADDRESS did no specify any previous values. This makes updating \'users.addressId\' much less efficient. Provide the values of the item you are destroying as the second argument to destroy*().'
            );
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
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
          collections: {
            '': {
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
      }, { create: true, update: true, destroy: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: {
          addresses: {
            ...this.addresses,
          },
        }
      }, {
        index: true,
        new: true,
      });

      this.reducers = reducers;
    });

    describe('and the association\'s CREATE action occurs', function () {
      beforeAll(function () {
        this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

        fetchMock.post('http://test.com/addresses', {
          body: { id: 3, userIds: [ 1 ], city: 'New City 3' },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store.dispatch(this.addresses.createAddress('temp', { userIds: [ 1 ], city: 'New City 3' }));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before the request has completed', function () {
        it('then adds the new association to the default attribute', function() {
          expect(this.users.items[1].values.addressId).toEqual('temp');
        });
      });

      describe('and the request has completed', () => {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then updates the key of the association', function() {
          expect(this.users.items[1].values.addressId).toEqual(3);
        });
      });

    });

    describe('and the association\'s UPDATE action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.put('http://test.com/addresses/1', {
            body: {
              city: 'City 1',
              userIds: [ 2 ]
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.updateAddress(1, {
            city: 'City 1',
            userIds: [ 2 ]
          }, {
            city: 'City 1',
            userIds: [ 1 ]
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
            expect(this.users.items[2].values.addressId).toEqual(undefined);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.addressId).toEqual(1);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.put('http://test.com/addresses/1', {
            body: {
              city: 'City 1',
              userIds: [ 2 ]
            },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.updateAddress(1, {
            city: 'City 1',
            userIds: [ 2 ]
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: UPDATE_ADDRESS did no specify any previous values. This makes updating \'users.addressId\' much less efficient. Provide the values of the item you are destroying as the third argument to update*().'
            );
          });

          it('then removes the associated item from old associated items', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });

          it('then adds the associated item to new associated items', function() {
            expect(this.users.items[2].values.addressId).toEqual(1);
          });
        });
      });

    });

    describe('and the association\'s DESTROY action occurs', function () {
      describe('and the previous values have been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.delete('http://test.com/addresses/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.destroyAddress(1, {
            city: 'City 1',
            userIds: [ 1 ]
          }));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then does NOT display a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).not.toHaveBeenCalled();
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });
        });
      });

      describe('and the previous values have NOT been specified', () => {
        beforeAll(function () {
          this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

          fetchMock.delete('http://test.com/addresses/1', {
            body: { },
          }, new Promise((resolve) => {
            this.resolveRequest = resolve;
          }));

          spyOn(console, 'warn');

          this.store.dispatch(this.addresses.destroyAddress(1));

          this.users = this.store.getState().users;
        });

        afterAll(function() {
          fetchMock.restore();
        });

        describe('before the request has completed', function () {
          it('then does NOT remove the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(1);
          });
        });

        describe('and the request has completed', () => {
          beforeAll(function () {
            this.resolveRequest();

            this.users = this.store.getState().users;
          });

          it('then displays a warning', function() {
            // eslint-disable-next-line no-console
            expect(console.warn).toHaveBeenCalledWith(
              'Redux and the REST: DESTROY_ADDRESS did no specify any previous values. This makes updating \'users.addressId\' much less efficient. Provide the values of the item you are destroying as the second argument to destroy*().'
            );
          });

          it('then removes the associated item', function() {
            expect(this.users.items[1].values.addressId).toEqual(undefined);
          });
        });
      });

    });

  });
});
