import fetchMock from 'fetch-mock';
import { resources, ERROR, SUCCESS, UPDATING, RESOURCES, EDITING } from '../../../index';
import nop from '../../../utils/function/nop';
import {
  expectToChangeResourcesItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourcesItemStatusTo,
  expectToChangeResourcesItemValuesTo, expectToNotChangeResourcesItemStatus, expectToNotChangeResourcesItemValues,
  setupInitialState
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Update reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { updateUser } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
    }, {
      update: true
    });

    this.updateUser = updateUser;
    this.reducers = reducers;

    this.itemId = 1;
    this.newValues = { username: 'Robert' };
    this.serverValues = { id: 1, username: 'Robert', approved: false };
  });

  describe('Given the resource is NOT in the store', function () {
    describe('when the action creator is called and before the request has completed', function () {
      beforeAll(function () {
        spyOn(console, 'warn');

        setUpBeforeRequest(this, { ...RESOURCES }, 'http://test.com/users/1', this.itemId);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then warns about trying to update an item not in the store', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith('Redux and the REST: UPDATE_USER\'s key \'1\' did not match any items in the store. Check the arguments passed to updateUser(). (Update request still sent to the server.)');
      });

      it('then adds a new item with a status of UPDATING', function() {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', UPDATING);
      });

      it('then adds a new item with values specified', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.newValues);
      });
    });

    describe('when the API request succeeds', function() {
      beforeAll(function () {
        spyOn(console, 'warn');

        setUpAfterRequestSuccess(this, { ...RESOURCES }, 'http://test.com/users/1', this.itemId, this.newValues, {
          body: this.serverValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to SUCCESS', function() {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', SUCCESS);
      });

      it('then sets the item\'s values from the response', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.serverValues);
      });
    });
  });

  describe('Given the resource is in the store', () => {
    const resourceBefore = {
      items: {
        1: {
          values: { username: 'Bob', id: 1 },
          status: { type: SUCCESS }
        }
      },
    };

    describe('and only the item\'s id is passed to the action creator', () => {
      expectToCorrectlyUpdateItemInStore({ ...RESOURCES, ...resourceBefore }, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToCorrectlyUpdateItemInStore({ ...RESOURCES, ...resourceBefore }, { id: 1 });
    });
  });

  describe('Given the resource item has been edited previously', () => {
    const resourceBefore = {
      items: {
        1: {
          values: { username: 'Bob', id: 1 },
          status: {
            type: EDITING,
            dirty: true,
            originalValues: { username: 'Bobert', id: 1 }
          }
        }
      },
    };

    describe('and only the item\'s id is passed to the action creator', () => {
      expectToCorrectlyUpdateAnEditedResourceItem({ ...RESOURCES, ...resourceBefore }, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToCorrectlyUpdateAnEditedResourceItem({ ...RESOURCES, ...resourceBefore }, { id: 1 });
    });
  });

  describe('Given a update action that will succeed with a response that specifies \'errors\' at the top level', () => {
    expectToMergeInMultipleErrors(1, { body: { errors: ['Not Found'] }, status: 200 });
  });

  describe('Given a update action that will fail with a response that specifies \'errors\' at the top level', () => {
    expectToMergeInMultipleErrors(1, { body: { errors: ['Not Found'] }, status: 400 });
  });

  function expectToCorrectlyUpdateItemInStore(initialState, params) {
    describe('when the action creator is called and before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, 'http://test.com/users/1', params);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the item\'s status type to UPDATING', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', UPDATING);
      });

      it('then merges in the new values with the item\'s old ones', function () {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.newValues);
      });
    });

    describe('when the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState, 'http://test.com/users/1', params, this.newValues, {
          body: this.serverValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to SUCCESS', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, SUCCESS);
      });

      it('then sets the item\'s values from the response', function () {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.serverValues);
      });
    });

    describe('when the API request errors', function () {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(
          this,
          initialState,
          'http://test.com/users/1',
          params,
          this.options
        );
      });

      afterAll(function () {
        tearDown(this);
      });

      expectToHandleErrorResponse();
    });
  }

  function expectToCorrectlyUpdateAnEditedResourceItem(initialState, params) {
    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, 'http://test.com/users/1', params);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the item\'s status type to UPDATING', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', UPDATING);
      });

      it('then does NOT unset the dirty bit', function () {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.itemId, 'dirty');
      });

      it('then does NOT clear the originalValues', function () {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.itemId, 'originalValues');
      });

      it('then merges in the new values with the item\'s old ones', function () {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.newValues);
      });
    });

    describe('and the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState, 'http://test.com/users/1', params, this.newValues, {
          body: this.serverValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to SUCCESS', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', SUCCESS);
      });

      it('then removes the dirty bit', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'dirty', undefined);
      });

      it('then clears the original values', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'originalValues', undefined);
      });

      it('then sets the item\'s values from the response', function () {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.serverValues);
      });
    });

    describe('and the API request errors', function () {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(
          this,
          initialState,
          'http://test.com/users/1',
          params,
          this.options
        );
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then does NOT unset the dirty bit', function () {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.itemId, 'dirty');
      });

      it('then does NOT clear the originalValues', function () {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.itemId, 'originalValues');
      });

      expectToHandleErrorResponse();
    });
  }

  function expectToHandleErrorResponse() {
    it('then changes the items\'s status type to ERROR', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', ERROR);
    });

    it('then sets the syncedAt attribute', function () {
      expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, this.itemId);
    });

    it('then updates the item\'s status httpCode', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'httpCode', this.options.status);
    });

    it('then does not update the values from the response', function () {
      expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.itemId);
    });

    it('then sets the status error from the response', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'error', { message: this.options.body.error });
    });
  }

  function expectToMergeInMultipleErrors(itemId, options) {
    describe('when the request has completed', function () {
      beforeAll(function () {
        setUpAfterRequestFailure(this, { ...RESOURCES, items: {
            [itemId]: {
              values: { username: 'Bob', id: itemId },
              status: { type: SUCCESS }
            }
          }, }, 'http://test.com/users/1', itemId, options);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to ERROR', function() {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', ERROR);
      });

      it('then sets the syncedAt attribute', function() {
        expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, this.itemId);
      });

      it('then updates the item\'s status httpCode', function() {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'httpCode', options.status);
      });

      it('then sets the item\'s status error from the response', function () {
        const { body: { errors } } = options;
        const [errorMessage] = errors;

        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, itemId, 'error', errorMessage);
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, itemId, 'errors', [errorMessage]);
      });
    });
  }

  function setUpBeforeRequest(context, initialState, url, params) {
    fetchMock.put(url, new Promise(nop));

    setupState(context, initialState, params);
  }

  function setUpAfterRequestSuccess(context, initialState, url, params, values, options = { body: {} }) {
    fetchMock.put(url, options);

    setupState(context, initialState, params, values);
  }

  function setUpAfterRequestFailure(context, initialState, url, params, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.put(url, options);

    setupState(context, initialState, params);
  }

  function setupState(context, initialState, params, values) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.updateUser(params, values));
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
