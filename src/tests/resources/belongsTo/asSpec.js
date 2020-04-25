import fetchMock from 'fetch-mock';
import { resources, RESOURCES, SUCCESS } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';

describe('belongsTo:', function () {
  describe('when the \'as\' option is used', function () {
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
            as: 'resident'
          },
        }
      }, {
        new: true,
      });

      this.reducers = reducers;
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        fetchMock.post('http://test.com/addresses', new Promise(nop));

        this.store = buildStore({ ...this.initialState }, {
          users: this.reducers,
          addresses: this.addresses.reducers
        });

        this.store.dispatch(
          this.addresses.actionCreators.createAddress('temp', { residentId: 1, city: 'City 3' })
        );
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'as\' option to find the foreign key on the associated resource', function() {
        expect(this.store.getState().users.items['1'].values.addressId).toEqual('temp');
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        fetchMock.post('http://test.com/addresses', {
          body: { id: 3, residentId: 1, city: 'City 3' },
        });

        this.store = buildStore({ ...this.initialState }, {
          users: this.reducers,
          addresses: this.addresses.reducers
        });

        this.store.dispatch(
          this.addresses.actionCreators.createAddress('temp', { residentId: 1, city: 'City 3' })
        );
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'as\' option to find the foreign key on the associated resource', function() {
        expect(this.store.getState().users.items['1'].values.addressId).toEqual(3);
      });
    });
  });
});
