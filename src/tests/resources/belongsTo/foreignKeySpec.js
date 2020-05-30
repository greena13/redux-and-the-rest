import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';
import EmptyKey from '../../../constants/EmptyKey';
import { expectToChangeResourcesItemValuesTo } from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

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
          lists: {
            [EmptyKey]: {
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
      }, { createItem: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        belongsTo: {
          addresses: {
            foreignKey: 'residentIdentity'
          },
        }
      }, {
        newItem: true,
      });

      this.reducers = reducers;
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        fetchMock.post('http://test.com/addresses', new Promise(nop));

        this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

        this.store.dispatch(this.addresses.actionCreators.createItem('temp', { residentIdentity: 1, city: 'City 3' }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 'temp');
      });
    });

    describe('and the request has completed', () => {
      beforeAll(function () {
        fetchMock.post('http://test.com/addresses', {
          body: { id: 3, residentIdentity: 1, city: 'City 3' },
        });

        this.store = buildStore({ ...this.initialState }, { users: this.reducers, addresses: this.addresses.reducers });

        this.store.dispatch(this.addresses.actionCreators.createItem('temp', { residentIdentity: 1, city: 'City 3' }));
      });

      afterAll(function() {
        fetchMock.restore();
        this.store = null;
      });

      it('then uses the value of the \'foreignKey\' as the foreign key on the associated resource', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'addressId', 3);
      });
    });
  });
});
