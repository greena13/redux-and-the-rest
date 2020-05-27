import fetchMock from 'fetch-mock';

import {
  resource,
  CREATING, DESTROY_ERROR, DESTROYING, EDITING, ERROR, NEW, SUCCESS, UPDATING
} from '../../../index';

import nop from '../../../utils/function/nop';

import {
  expectToChangeNewItemKeyTo,
  expectToChangeResourceItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourceItemStatusTo,
  expectToChangeSelectionMapTo,
  expectToNotChangeNewItemKey,
  expectToNotChangeSelectionMap,
  resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('DestroyItem reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { destroyItem: destroyUser } } = resource({
      name: 'users',
      url: 'http://test.com/users',
      keyBy: 'id'
    }, {
      destroyItem: true
    });

    this.reducers = reducers;
    this.destroyUser = destroyUser;
  });

  describe('Given the resource item is NOT in the store', () => {
    expectToHandleSuccessAndFailedRequests({
      items: {},
      lists: {},
      selectionMap: {},
      newItemKey: null
    }, `Redux and the REST: DESTROY_USER\'s key \'${EmptyKey}\' did not match any items in the store. (Destroy request was still sent to the server.)`);
  });

  describe('Given the resource item is in the store with a status of NEW', () => {
    expectToHandleSuccessAndFailedRequests(getInitialState(NEW), `Redux and the REST: DESTROY_USER\'s key \'${EmptyKey}\' matched a new item. Use clearNewItem() to clear items that haven\'t been saved to the server. (Destroy request was still sent to the server.)`);
  });

  describe('Given a resources item is in the store with a status of DESTROYING', () => {
    expectToHandleSuccessAndFailedRequests(getInitialState(DESTROYING), `Redux and the REST: DESTROY_USER\'s key \'${EmptyKey}\' matched a new item that has a pending DESTROY action. (Duplicate destroyItem request was still sent to the server.)`);
  });

  describe('Given a resources item is in the store with a status of EDITING', () => {
    expectToHandleSuccessAndFailedRequestsForExistingResourceItem(getInitialState(EDITING));
  });

  describe('Given a resources item is in the store with a status of CREATING', () => {
    expectToHandleSuccessAndFailedRequestsForExistingResourceItem(getInitialState(CREATING));
  });

  describe('Given a resources item is in the store with a status of UPDATING', () => {
    expectToHandleSuccessAndFailedRequestsForExistingResourceItem(getInitialState(UPDATING));
  });

  describe('Given a resources item is in the store with a status of SUCCESS', () => {
    expectToHandleSuccessAndFailedRequestsForExistingResourceItem(getInitialState(SUCCESS));
  });

  describe('Given a resources item is in the store with a status of ERROR', () => {
    expectToHandleSuccessAndFailedRequestsForExistingResourceItem(getInitialState(ERROR));
  });

  describe('Given a destroyItem action that will succeed with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      expectToHandleErrorsCorrectly(200);
    });
  });

  describe('Given a destroyItem action that will fail with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      expectToHandleErrorsCorrectly(404);
    });
  });

  function expectToHandleSuccessAndFailedRequests(initialState, warning = undefined) {
    beforeAll(function () {
      spyOn(console, 'warn');
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState);
      });

      afterAll(function() {
        tearDown(this);
      });

      it('then warns about the missing resource', function () {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(warning);
      });

      it('then creates a new item and sets its status to DESTROYING', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', DESTROYING);
      });
    });

    describe('when the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState);
      });

      afterAll(() => tearDown(this));

      it('then removes the item', function () {
        expect(resourcesDefinition(this, RESOURCE_NAME).items).toEqual({});
      });
    });

    describe('when the API request errors', function () {
      beforeAll(function () {
        setUpAfterRequestFailure(this, initialState);
      });

      afterAll(function(){
        tearDown(this);
      });

      expectToRecordDestroyError(404);
    });
  }

  function expectToRecordDestroyError(status) {
    it('then updates the items\'s status to DESTROY_ERROR', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', DESTROY_ERROR);
    });

    it('then sets the syncedAt attribute', function () {
      expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
    });

    it('then updates the item\'s status httpCode', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', status);
    });
  }

  function expectToHandleErrorsCorrectly(status) {
    beforeAll(function () {
      setUpAfterRequestFailure(this, getInitialState(SUCCESS), {
        body: { errors: [{ message: 'Not Found' }] },
        status
      });
    });

    afterAll(function() {
      tearDown(this);
    });

    expectToRecordDestroyError(status);

    it('then sets the item\'s errors', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'error', { message: 'Not Found' });
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'errors', [{ message: 'Not Found' }]);
    });
  }


  function expectToHandleSuccessAndFailedRequestsForExistingResourceItem(initialState) {
    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState);
      });

      afterAll(() => tearDown(this));

      it('then creates a new item and sets its status to DESTROYING', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', DESTROYING);
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
        setUpAfterRequestSuccess(this, initialState);
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
        setUpAfterRequestFailure(this, initialState);
      });

      afterAll(function(){
        tearDown(this);
      });

      expectToRecordDestroyError(404);

      it('then does NOT clear the item from thew newItemKey', function() {
        expectToNotChangeNewItemKey(this, RESOURCE_NAME);
      });

      it('then updates the item\'s status httpCode', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', 404);
      });
    });
  }

  function getInitialState(statusType) {
    return {
      items: {
        [EmptyKey]: {
          values: { username: 'Bob' },
          status: { type: statusType }
        }
      },
      lists: {},
      selectionMap: {},
      newItemKey: null
    };
  }

  function setUpBeforeRequest(context, initialState) {
    fetchMock.delete('http://test.com/users', new Promise(nop));

    setupState(context, initialState);
  }

  function setUpAfterRequestSuccess(context, initialState, actionCreatorOptions = {}) {
    fetchMock.delete('http://test.com/users', { body: {} });

    setupState(context, initialState, actionCreatorOptions);
  }

  function setUpAfterRequestFailure(context, initialState, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.delete('http://test.com/users', options);

    setupState(context, initialState);
  }

  function setupState(context, initialState) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.destroyUser());
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
