import fetchMock from 'fetch-mock';

import {
  resources,
  CREATING, DESTROY_ERROR, DESTROYING, EDITING, ERROR, NEW, SUCCESS, UPDATING
} from '../../../index';

import nop from '../../../utils/function/nop';

import {
  expectToChangeNewItemKeyTo,
  expectToChangeResourcesItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourcesItemStatusTo,
  expectToChangeSelectionMapTo,
  expectToNotChangeNewItemKey,
  expectToNotChangeSelectionMap,
  resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('DestroyItem reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { destroyItem: destroyUser } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id'
    }, {
      destroyItem: true
    });

    this.reducers = reducers;
    this.destroyUser = destroyUser;
  });

  describe('Given the resources item is NOT in the store', () => {
    expectToHandleSuccessAndFailedRequests({
      items: {},
      collections: {},
      selectionMap: {},
      newItemKey: null
    }, 1, 1, 'Redux and the REST: DESTROY_USER\'s key \'1\' did not match any items in the store. (Destroy request was still sent to the server.)');
  });

  describe('Given a resources item is in the store with a status of NEW', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequests(getInitialState(NEW), 1, 1, 'Redux and the REST: DESTROY_USER\'s key \'1\' matched a new item. Use clearNewItem() to clear items that haven\'t been saved to the server. (Destroy request was still sent to the server.)');
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequests(getInitialState(NEW), { id: 1 }, 1, 'Redux and the REST: DESTROY_USER\'s key \'1\' matched a new item. Use clearNewItem() to clear items that haven\'t been saved to the server. (Destroy request was still sent to the server.)');
    });
  });

  describe('Given a resources item is in the store with a status of DESTROYING', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequests(getInitialState(DESTROYING), 1, 1, 'Redux and the REST: DESTROY_USER\'s key \'1\' matched a new item that has a pending DESTROY action. (Duplicate destroyItem request was still sent to the server.)');
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequests(getInitialState(DESTROYING), { id: 1 }, 1, 'Redux and the REST: DESTROY_USER\'s key \'1\' matched a new item that has a pending DESTROY action. (Duplicate destroyItem request was still sent to the server.)');
    });
  });

  describe('Given a resources item is in the store with a status of EDITING', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(EDITING), 1, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(EDITING), { id: 1 }, 1);
    });
  });

  describe('Given a resources item is in the store with a status of CREATING', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(CREATING), 1, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(CREATING), { id: 1 }, 1);
    });
  });

  describe('Given a resources item is in the store with a status of UPDATING', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(UPDATING), 1, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(UPDATING), { id: 1 }, 1);
    });
  });

  describe('Given a resources item is in the store with a status of SUCCESS', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(SUCCESS), 1, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(SUCCESS), { id: 1 }, 1);
    });
  });

  describe('Given a resources item is in the store with a status of ERROR', () => {
    describe('and only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(ERROR), 1, 1);
    });

    describe('and the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(getInitialState(ERROR), { id: 1 }, 1);
    });
  });

  describe('Given a destroyItem action that will succeed with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      expectToHandleErrorsCorrectly(1, 200);
    });
  });

  describe('Given a destroyItem action that will fail with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      expectToHandleErrorsCorrectly(1, 404);
    });
  });

  function expectToHandleSuccessAndFailedRequests(initialState, params, id, warning = undefined) {
    beforeAll(function () {
      spyOn(console, 'warn');
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, params, id);
      });

      afterAll(function() {
        tearDown(this);
      });

      it('then warns about the missing resource', function () {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(warning);
      });

      it('then creates a new item and sets its status to DESTROYING', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', DESTROYING);
      });
    });

    describe('when the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState, params, id);
      });

      afterAll(() => tearDown(this));

      it('then removes the item', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).items).toEqual({});
      });
    });

    describe('when the API request errors', function () {
      beforeAll(function () {
        setUpAfterRequestFailure(this, initialState, params, id);
      });

      afterAll(function(){
        tearDown(this);
      });

      expectToRecordDestroyError(id, 404);
    });
  }

  function expectToRecordDestroyError(id, status) {
    it('then updates the items\'s status to DESTROY_ERROR', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', DESTROY_ERROR);
    });

    it('then sets the syncedAt attribute', function () {
      expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, id);
    });

    it('then updates the item\'s status httpCode', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'httpCode', status);
    });
  }

  function expectToHandleErrorsCorrectly(id, status) {
    beforeAll(function () {
      setUpAfterRequestFailure(this, getInitialState(SUCCESS), id, id, {
        body: { errors: [{ message: 'Not Found' }] },
        status
      });
    });

    afterAll(function() {
      tearDown(this);
    });

    expectToRecordDestroyError(id, status);

    it('then sets the item\'s errors', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'error', { message: 'Not Found' });
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'errors', [{ message: 'Not Found' }]);
    });
  }


  function expectToHandleSuccessAndFailedRequestsForExistingResourcesItem(initialState, params, id) {
    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, params, id);
      });

      afterAll(() => tearDown(this));

      it('then creates a new item and sets its status to DESTROYING', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', DESTROYING);
      });

      it('then does NOT remove the item from the selectionMap', function() {
        expectToNotChangeSelectionMap(this, RESOURCE_NAME);
      });

      it('then does NOT clear the item from thew newItemKey', function() {
        expectToNotChangeNewItemKey(this, RESOURCE_NAME);
      });
    });

    describe('when the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState, params, id);
      });

      afterAll(() => tearDown(this));

      it('then removes the item', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).items).toEqual({});
      });

      it('then removes the deleted item from the selectionMap', function() {
        expectToChangeSelectionMapTo(this, RESOURCE_NAME, {});
      });

      it('then removes the deleted item from the newItemKey', function() {
        expectToChangeNewItemKeyTo(this, RESOURCE_NAME, null);
      });
    });

    describe('when the API request errors', function () {
      beforeAll(function () {
        setUpAfterRequestFailure(this, initialState, params, id);
      });

      afterAll(function(){
        tearDown(this);
      });

      expectToRecordDestroyError(id, 404);

      it('then does NOT clear the item from thew newItemKey', function() {
        expectToNotChangeNewItemKey(this, RESOURCE_NAME);
      });

      it('then updates the item\'s status httpCode', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'httpCode', 404);
      });
    });
  }

  function getInitialState(statusType) {
    return {
      items: {
        1: {
          values: { username: 'Bob' },
          status: { type: statusType }
        }
      },
      collections: {},
      selectionMap: {},
      newItemKey: null
    };
  }

  function setUpBeforeRequest(context, initialState, params, id) {
    fetchMock.delete(`http://test.com/users/${id}`, new Promise(nop));

    setupState(context, initialState, params);
  }

  function setUpAfterRequestSuccess(context, initialState, params, id, actionCreatorOptions = {}) {
    fetchMock.delete(`http://test.com/users/${id}`, { body: {} });

    setupState(context, initialState, params, actionCreatorOptions);
  }

  function setUpAfterRequestFailure(context, initialState, params, id, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.delete(`http://test.com/users/${id}`, options);

    setupState(context, initialState, params);
  }

  function setupState(context, initialState, params) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.destroyUser(params));
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
