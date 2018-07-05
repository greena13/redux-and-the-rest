import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../../index';
import buildStore from '../../helpers/buildStore';

describe('belongsTo:', function () {
  describe('when the \'foreignKey\' option is used', function () {
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
            '': {
              positions: [ 1 ],
              status: { type: SUCCESS }
            }
          },
          selectionMap: { 1: true },
          newItemKey: null
        },
        addresses: {
          ...RESOURCES,
        }
      };
    });

    afterAll(function () {
      fetchMock.restore();
    });

    beforeAll(function () {

      /**
       * @type {{ actions, reducers, createAddress }}
       */
      this.addresses = resources({
        name: 'addresses',
        url: 'http://test.com/addresses/:id?',
        keyBy: 'id'
      }, { create: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: {
          addresses: {
            ...this.addresses,
            foreignKey: 'residentIdentity'
          },
        }
      }, {
        new: true,
      });

      this.reducers = reducers;

      this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

      fetchMock.post('http://test.com/addresses', {
        body: { id: 3, residentIdentity: 1, city: 'City 3' },
      }, new Promise((resolve) => {
        this.resolveRequest = resolve;
      }));

      this.store.dispatch(this.addresses.createAddress('temp', { residentIdentity: 1, city: 'City 3' }));

      this.users = this.store.getState().users;
    });

    afterAll(function() {
      fetchMock.restore();
    });

    describe('before the request has completed', function () {
      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expect(this.users.items[1].values.addressId).toEqual('temp');
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        this.resolveRequest();

        this.users = this.store.getState().users;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expect(this.users.items[1].values.addressId).toEqual(3);
      });
    });

  });
});
