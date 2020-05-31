import fetchMock from 'fetch-mock';

import { resources, NEW, SUCCESS, RESOURCES } from '../../../index';
import buildStore from '../../helpers/buildStore';
import nop from '../../../utils/function/nop';
import EmptyKey from '../../../constants/EmptyKey';
import {
  expectToChangeResourcesItemValuesTo,
  expectToClearResourcesItemValues, expectToNotChangeResourcesItemValues,
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('belongsTo:', function () {
  describe('Given a one-to-one association between items of two resources', () => {
    const userId = 1;
    const addressId = 1;
    const newUserId = 2;

    const baseUrl = 'http://test.com/addresses';

    const initialState = {
      users: {
        items: {
          [userId]: {
            values: {
              id: userId,
              username: 'Bob',
              addressId
            },
            status: { type: SUCCESS }
          },

          [newUserId]: {
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
            positions: [1],
            status: { type: SUCCESS }
          }
        },
        selectionMap: { 1: true },
        newItemKey: 'temp'
      },
      addresses: {
        ...RESOURCES,
        items: {
          [addressId]: {
            values: {
              city: 'City 1',
              userId
            },
            status: { type: SUCCESS }
          }
        }
      }
    };

    const newAddressValues = { userId, city: 'New City 3' };
    const updatedAddressValues = { id: addressId, userId: newUserId, city: 'New City 3' };

    expectToCorrectlyDefineAssociationIrrespectiveOfOrderResourcesAreDefined({
      setup: {
        baseUrl, initialState, userId, addressId, newUserId, newAddressValues, updatedAddressValues
      }
    });
  });

  function expectToCorrectlyDefineAssociationIrrespectiveOfOrderResourcesAreDefined({ setup }) {
    const { baseUrl, initialState, userId, addressId, newUserId, newAddressValues, updatedAddressValues } = setup;

    describe('and the associated resource is defined first', () => {
      beforeAll(function () {
        Reflect.apply(defineAddressesThenUsers, this, [baseUrl]);
      });

      expectToCorrectlySynchroniseItemWhenAssociatedOneChanges({
        setup: { initialState, userId, addressId, newUserId, newAddressValues, updatedAddressValues, baseUrl }
      });
    });

    describe('and the resource defining the association is defined first', () => {
      beforeAll(function () {
        Reflect.apply(defineUsersThenAddresses, this, [baseUrl]);
      });

      expectToCorrectlySynchroniseItemWhenAssociatedOneChanges({
        setup: { initialState, userId, addressId, newUserId, newAddressValues, updatedAddressValues, baseUrl }
      });
    });
  }

  describe('Given a one-to-many association between items of two resources', () => {
    const userId = 1;
    const addressId = 1;
    const newUserId = 2;

    const baseUrl = 'http://test.com/addresses';

    const initialState = {
      users: {
        items: {
          [userId]: {
            values: {
              id: 1,
              username: 'Bob',
              addressId
            },
            status: { type: SUCCESS }
          },

          [newUserId]: {
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
          [addressId]: {
            values: {
              city: 'City 1',
              userIds: [ userId ]
            },
            status: { type: SUCCESS }
          }
        }
      }
    };

    const newAddressValues = { userIds: [userId], city: 'New City 3' };
    const updatedAddressValues = { addressId, userIds: [newUserId], city: 'New City 3' };

    expectToCorrectlyDefineAssociationIrrespectiveOfOrderResourcesAreDefined({
      setup: {
        baseUrl, initialState, userId, addressId, newUserId, newAddressValues, updatedAddressValues
      }
    });
  });

  function expectToCorrectlySynchroniseItemWhenAssociatedOneChanges({ setup }) {
    const { initialState, userId, addressId, newUserId, newAddressValues, updatedAddressValues, baseUrl } = setup;

    describe('and the createItem action creator is called for the associated resource item', function () {
      const tempAddressId = 'temp';

      describe('when the request has yet to complete', function () {
        beforeAll(function () {
          setUpBeforeRequest(this,
            { ...initialState }, { users: this.reducers, addresses: this.addresses.reducers },
            this.addresses.actionCreators.createItem, tempAddressId, newAddressValues, {},
            'post', baseUrl
          );
        });

        fit('then sets the new association to the default attribute', function () {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, userId, 'addressId', tempAddressId);
        });

        afterAll(() => tearDown(this));
      });

      describe('when the request has completed', () => {
        const remoteAddressValues = { ...newAddressValues, id: addressId };

        beforeAll(function () {
          setUpAfterRequestSuccess(this,
            { ...initialState }, { users: this.reducers, addresses: this.addresses.reducers },
            this.addresses.actionCreators.createItem, 'temp', newAddressValues, {},
            'post', baseUrl, { body: remoteAddressValues }
          );
        });

        it('then updates the key of the association', function () {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, userId, 'addressId', remoteAddressValues.id);
        });

        afterAll(() => tearDown(this));
      });
    });

    describe('and the updateItem action creator for the associated resource item is called', () => {
      describe('with previousValues', () => {
        expectToSynchroniseItemsForeignKeyWhenAssociatedItemIsUpdated({
          setup: {
            initialState, addressId, updatedAddressValues, baseUrl, userId, newUserId,
            actionCreatorOptions: { previousValues: initialState.addresses.items[addressId].values }
          },
          expectations: {
            showWarning: false
          }
        });
      });

      describe('WITHOUT previousValues', () => {
        expectToSynchroniseItemsForeignKeyWhenAssociatedItemIsUpdated({
          setup: {
            initialState, addressId, updatedAddressValues, baseUrl, userId, newUserId,
            actionCreatorOptions: {}
          },
          expectations: {
            showWarning: true
          }
        });
      });
    });

    describe('and the destroyItem action creator for the associated resource item is called', () => {
      describe('with previousValues', () => {
        expectToSynchroniseItemsForeignKeyWhenAssociatedItemIsDeleted({
          setup: {
            initialState, addressId, baseUrl, userId,
            actionCreatorOptions: { previousValues: initialState.addresses.items[addressId].values }
          },
          expectations: {
            showWarning: false
          }
        });
      });

      describe('WITHOUT previousValues', () => {
        expectToSynchroniseItemsForeignKeyWhenAssociatedItemIsDeleted({
          setup: {
            initialState, addressId, baseUrl, userId,
            actionCreatorOptions: {}
          },
          expectations: {
            showWarning: true
          }
        });
      });
    });
  }

  function expectToSynchroniseItemsForeignKeyWhenAssociatedItemIsUpdated({ setup, expectations }) {
    const { initialState, addressId, updatedAddressValues, baseUrl, userId, newUserId, actionCreatorOptions } = setup;
    const { showWarning } = expectations;

    describe('when the request has yet to complete', function () {
      beforeAll(function () {
        setUpBeforeRequest(this,
          { ...initialState }, { users: this.reducers, addresses: this.addresses.reducers },
          this.addresses.actionCreators.updateItem, addressId, updatedAddressValues, actionCreatorOptions,
          'put', `${baseUrl}/${addressId}`
        );
      });

      it('then does NOT remove the associated item', function () {
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, userId, 'addressId');
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, newUserId, 'addressId');
      });

      afterAll(function() {
        tearDown(this);
      });
    });

    describe('when the request has completed', () => {
      beforeAll(function () {
        spyOn(console, 'warn');

        setUpAfterRequestSuccess(this,
          { ...initialState }, { users: this.reducers, addresses: this.addresses.reducers },
          this.addresses.actionCreators.updateItem, addressId, updatedAddressValues, actionCreatorOptions,
          'put', `${baseUrl}/${addressId}`, { body: updatedAddressValues }
        );
      });

      if (showWarning) {
        it('then displays a warning', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: UPDATE_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for updateItem() to specify these values.'
          );
        });
      } else {
        it('then does NOT display a warning', function () {
          // eslint-disable-next-line no-console
          expect(console.warn).not.toHaveBeenCalled();
        });
      }

      it('then removes the associated item from the previously associated items', function () {
        expectToClearResourcesItemValues(this, RESOURCE_NAME, userId, 'addressId');
      });

      it('then adds the associated item to newly associated items', function () {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, newUserId, 'addressId', addressId);
      });

      afterAll(function() {
        tearDown(this);
      });
    });
  }


  function expectToSynchroniseItemsForeignKeyWhenAssociatedItemIsDeleted({ setup, expectations }) {
    const { initialState, addressId, baseUrl, userId, actionCreatorOptions } = setup;
    const { showWarning } = expectations;

    describe('when the request has yet to complete', function () {
      beforeAll(function () {
        setUpBeforeRequest(this,
          { ...initialState }, { users: this.reducers, addresses: this.addresses.reducers },
          this.addresses.actionCreators.destroyItem, addressId, actionCreatorOptions, null,
          'delete', `${baseUrl}/${addressId}`
        );
      });

      it('then does NOT remove the associated item', function() {
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, userId, 'addressId');
      });

      afterAll(function() {
        tearDown(this);
      });
    });

    describe('when the request has completed', () => {
      beforeAll(function () {
        spyOn(console, 'warn');

        setUpAfterRequestSuccess(this,
          { ...initialState }, { users: this.reducers, addresses: this.addresses.reducers },
          this.addresses.actionCreators.destroyItem, addressId, actionCreatorOptions, null,
          'delete', `${baseUrl}/${addressId}`, { body: {} }
        );
      });

      if (showWarning) {
        it('then displays a warning', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: DESTROY_ADDRESS did not specify any previous values. This makes updating \'users.addressId\' much less efficient. Use the previousValues option for destroyItem() to specify these values.'
          );
        });
      } else {
        it('then does NOT display a warning', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).not.toHaveBeenCalled();
        });
      }

      it('then removes the associated item', function() {
        expectToClearResourcesItemValues(this, RESOURCE_NAME, userId, 'addressId');
      });

      afterAll(function() {
        tearDown(this);
      });
    });
  }

  function defineUsersThenAddresses(baseUrl) {
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

    this.addresses = resources({
      name: 'addresses',
      url: `${baseUrl}/:id?`,
      keyBy: 'id'
    }, ['createItem', 'updateItem', 'destroyItem']);

    this.reducers = reducers;
  }

  function defineAddressesThenUsers(baseUrl) {
    this.addresses = resources({
      name: 'addresses',
      url: `${baseUrl}/:id?`,
      keyBy: 'id'
    }, ['createItem', 'updateItem', 'destroyItem']);

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
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }

  function setUpBeforeRequest(context, initialState, reducers, actionCreator, params, values, actionCreatorOptions, requestType, url) {
    fetchMock[requestType](url, new Promise(nop));

    setupState(context, initialState, reducers, actionCreator, params, values, actionCreatorOptions);
  }

  function setUpAfterRequestSuccess(context, initialState, reducers, actionCreator, params, values, actionCreatorOptions, requestType, url, requestOptions) {
    fetchMock[requestType](url, requestOptions);

    setupState(context, initialState, reducers, actionCreator, params, values, actionCreatorOptions);
  }

  function setupState(context, initialState, reducers, actionCreator, params, values, actionCreatorOptions = {}) {
    _setupInitialState(context, RESOURCE_NAME, initialState, reducers);

    context.store.dispatch(actionCreator(params, values, actionCreatorOptions));
  }

  function _setupInitialState(context, resourceName, initialState, reducers) {
    context.initialState = initialState;

    context.store = buildStore(initialState, reducers);
  }
});
