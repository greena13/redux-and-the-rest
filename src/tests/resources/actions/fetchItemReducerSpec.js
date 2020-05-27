import fetchMock from 'fetch-mock';
import { resources, ERROR, FETCHING, SUCCESS, RESOURCES } from '../../../index';
import nop from '../../../utils/function/nop';
import {
  expectToChangeResourcesItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourcesItemStatusTo,
  expectToChangeResourcesItemValuesTo,
  expectToNotChangeResourcesItemValues,
  resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('Fetch reducers:', function () {
  describe('Given the keyBy option passed to resources is a string', function () {
    beforeAll(function() {
      const { reducers, actionCreators: { fetchItem: fetchUser } } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
      }, {
        fetchItem: true
      });

      this.fetchUser = fetchUser;
      this.reducers = reducers;
    });

    describe('Given no actions have come before it', () => {
      beforeAll(function () {
        this.url = 'http://test.com/users/1';
      });

      describe('When only the item\'s id is passed to the action creator', () => {
        expectToHandleSuccessAndFailure(this.url, 1, 1);
      });

      describe('When the item\'s id is passed as an object to the action creator', () => {
        expectToHandleSuccessAndFailure(this.url, 1, { id: 1 });
      });
    });

    describe('and another fetchItem action has come before it', function () {
      beforeAll(function () {
        this.url = 'http://test.com/users/1';

        this.resourceBefore = {
          items: {
            1: {
              values: {
                id: 1,
                username: 'Bob'
              },
              status: { type: SUCCESS }
            }
          }
        };

        this.itemId = 1;
      });

      describe('before the request has completed', function () {
        beforeAll(function () {
          setUpBeforeRequest(this, { ...RESOURCES, ...this.resourceBefore }, this.url, 1);
        });

        afterAll(function () {
          tearDown(this);
        });

        it('then sets the status of the item to FETCHING', function() {
          expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', FETCHING);
        });

        it('then does NOT clear the item\'s values', function() {
          expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.itemId);
        });

        it('then does NOT add the item to the default list', function() {
          expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual({});
        });
      });

      describe('When the API request succeeds', () => {
        expectToMergeInResponseBody(this.url, 1, 1, { ...RESOURCES, ...this.resourceBefore });
      });

      describe('when the API request errors', () => {
        expectToMergeInError(this.url, 1, 1, { ...RESOURCES, ...this.resourceBefore });
      });
    });

    describe('Given a fetchItem action that will succeed with a response that specifies \'errors\' at the top level', () => {
      expectToMergeInMultipleErrors(1, { body: { errors: ['Not Found'] }, status: 200 });
    });

    describe('Given a fetchItem action that will fail with a response that specifies \'errors\' at the top level', () => {
      expectToMergeInMultipleErrors(1, { body: { errors: ['Not Found'] }, status: 400 });
    });
  });

  describe('when the keyBy option is an array', () => {
    beforeAll(function() {
      const { reducers, actionCreators: { fetchItem: fetchUser } } = resources({
        name: 'users',
        url: 'http://test.com/groups/:groupId/users/:id?',
        keyBy: ['id', 'groupId'],
      }, {
        fetchItem: true
      });

      this.fetchUser = fetchUser;
      this.reducers = reducers;
    });

    expectToHandleSuccessAndFailure('http://test.com/groups/1/users/1', 'groupId=1.id=1', { id: 1, groupId: 1 });
  });

  function expectToHandleSuccessAndFailure(url, id, params) {
    describe('before the request has completed', function () {
      expectToSetFetchingState(url, id, params);
    });

    describe('and the API request succeeds', function () {
      expectToMergeInResponseBody(url, id, params, { ...RESOURCES });
    });

    describe('when the API request errors', function () {
      expectToMergeInError(url, id, params, { ...RESOURCES });
    });
  }

  function expectToSetFetchingState(url, id, params) {
    beforeAll(function () {
      setUpBeforeRequest(this, { ...RESOURCES }, url, params);
    });

    afterAll(function () {
      tearDown(this);
    });

    it('then adds a new item with a status of FETCHING', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', FETCHING);
    });

    it('then adds a new item with empty values', function () {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, id, {});
    });

    it('then does NOT add the item to the default list', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).lists).toEqual({});
    });
  }

  function expectToMergeInResponseBody(url, id, params, initialState) {
    beforeAll(function () {
      this.newValues = { id: 1, username: 'Bob' };

      setUpAfterRequestSuccess(this, initialState, url, params, {
        body: this.newValues,
      });
    });

    afterAll(function () {
      tearDown(this);
    });

    it('then changes the items\'s status type to SUCCESS', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', SUCCESS);
    });

    it('then sets the item\'s values from the response', function () {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, id, this.newValues);
    });
  }

  function expectToMergeInError(url, id, params, initialState) {
    beforeAll(function () {
      this.options = {
        body: { error: 'Not Found' },
        status: 404
      };

      setUpAfterRequestFailure(this, initialState, url, params, this.options);
    });

    afterAll(function () {
      tearDown(this);
    });

    it('then changes the items\'s status type to ERROR', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'type', ERROR);
    });

    it('then sets the syncedAt attribute', function () {
      expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, id);
    });

    it('then updates the item\'s status httpCode', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'httpCode', 404);
    });

    it('then sets the item\'s status error from the response', function () {
      expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, id, 'error', { message: this.options.body.error });
    });

    it('then does NOT set the item\'s values from the response', function () {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, id, {});
    });
  }

  function expectToMergeInMultipleErrors(itemId, options) {
    describe('when the request has completed', function () {
      beforeAll(function () {
        setUpAfterRequestFailure(this, { ...RESOURCES }, 'http://test.com/users/1', itemId, options);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to ERROR', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, itemId, 'type', ERROR);
      });

      it('then sets the syncedAt attribute', function () {
        expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, itemId);
      });

      it('then updates the item\'s status httpCode', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, itemId, 'httpCode', options.status);
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
    fetchMock.get(url, new Promise(nop));

    setupState(context, initialState, params);
  }

  function setUpAfterRequestSuccess(context, initialState, url, params, options = { body: {} }) {
    fetchMock.get(url, options);

    setupState(context, initialState, params);
  }

  function setUpAfterRequestFailure(context, initialState, url, params, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.get(url, options);

    setupState(context, initialState, params);
  }

  function setupState(context, initialState, params) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.fetchUser(params));
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
