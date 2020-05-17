import fetchMock from 'fetch-mock';
import { resource, ERROR, FETCHING, SUCCESS, RESOURCES } from '../../../index';
import nop from '../../../utils/function/nop';
import {
  expectToChangeResourceItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourceItemStatusTo,
  expectToChangeResourceItemValuesTo,
  expectToNotChangeResourceItemValues, resourceDefinition, resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Show reducers:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { fetchItem: fetchUser } } = resource({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
    }, {
      show: true
    });

    this.fetchUser = fetchUser;
    this.reducers = reducers;
  });

  describe('Given no actions have come before it', () => {
    beforeAll(function () {
      this.url = 'http://test.com/users';
    });

    describe('When only the item\'s id is passed to the action creator', () => {
      expectToHandleSuccessAndFailure(this.url);
    });

    describe('When the item\'s id is passed as an object to the action creator', () => {
      expectToHandleSuccessAndFailure(this.url);
    });
  });

  describe('Given another show action has come before it', function () {
    beforeAll(function () {
      this.url = 'http://test.com/users';

      this.resourceBefore = {
        items: {
          [EmptyKey]: {
            values: {
              id: 1,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        }
      };

      this.id = 1;
    });

    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, { ...RESOURCES, ...this.resourceBefore }, this.url);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the status of the item to FETCHING', function() {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', FETCHING);
      });

      it('then does NOT clear the item\'s values', function() {
        expectToNotChangeResourceItemValues(this, RESOURCE_NAME);
      });

      it('then does NOT add the item to the default collection', function() {
        expect(resourceDefinition(this, RESOURCE_NAME).collections).toEqual({});
      });
    });

    describe('When the API request succeeds', () => {
      expectToMergeInResponseBody(this.url, { ...RESOURCES, ...this.resourceBefore });
    });

    describe('when the API request errors', () => {
      expectToMergeInError(this.url, { ...RESOURCES, ...this.resourceBefore });
    });
  });

  describe('Given a show action that will succeed with a response that specifies \'errors\' at the top level', () => {
    expectToMergeInMultipleErrors({ body: { errors: ['Not Found'] }, status: 200 });
  });

  describe('Given a show action that will fail with a response that specifies \'errors\' at the top level', () => {
    expectToMergeInMultipleErrors({ body: { errors: ['Not Found'] }, status: 400 });
  });

  function expectToHandleSuccessAndFailure(url) {
    describe('before the request has completed', function () {
      expectToSetFetchingState(url);
    });

    describe('and the API request succeeds', function () {
      expectToMergeInResponseBody(url, { ...RESOURCES });
    });

    describe('when the API request errors', function () {
      expectToMergeInError(url, { ...RESOURCES });
    });
  }

  function expectToSetFetchingState(url) {
    beforeAll(function () {
      setUpBeforeRequest(this, { ...RESOURCES }, url);
    });

    afterAll(function () {
      tearDown(this);
    });

    it('then adds a new item with a status of FETCHING', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', FETCHING);
    });

    it('then adds a new item with empty values', function () {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, {});
    });

    it('then does NOT add the item to the default collection', function () {
      expect(resourcesDefinition(this, RESOURCE_NAME).collections).toEqual({});
    });
  }

  function expectToMergeInResponseBody(url, initialState) {
    beforeAll(function () {
      this.newValues = { username: 'Bob' };

      setUpAfterRequestSuccess(this, initialState, url, {
        body: this.newValues,
      });
    });

    afterAll(function () {
      tearDown(this);
    });

    it('then changes the items\'s status type to SUCCESS', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', SUCCESS);
    });

    it('then sets the item\'s values from the response', function () {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });
  }

  function expectToMergeInError(url, initialState) {
    beforeAll(function () {
      this.options = {
        body: { error: 'Not Found' },
        status: 404
      };

      setUpAfterRequestFailure(this, initialState, url, this.options);
    });

    afterAll(function () {
      tearDown(this);
    });

    it('then changes the items\'s status type to ERROR', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', ERROR);
    });

    it('then sets the syncedAt attribute', function () {
      expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
    });

    it('then updates the item\'s status httpCode', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', 404);
    });

    it('then sets the item\'s status error from the response', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'error', { message: this.options.body.error });
    });

    it('then does NOT set the item\'s values from the response', function () {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, {});
    });
  }

  function expectToMergeInMultipleErrors(options) {
    describe('when the request has completed', function () {
      beforeAll(function () {
        this.id = 1;

        setUpAfterRequestFailure(this, { ...RESOURCES }, 'http://test.com/users', options);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to ERROR', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', ERROR);
      });

      it('then sets the syncedAt attribute', function () {
        expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
      });

      it('then updates the item\'s status httpCode', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', options.status);
      });

      it('then sets the item\'s status error from the response', function () {
        const { body: { errors } } = options;
        const [errorMessage] = errors;

        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'error', errorMessage);
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'errors', [errorMessage]);
      });
    });
  }

  function setUpBeforeRequest(context, initialState, url) {
    fetchMock.get(url, new Promise(nop));

    setupState(context, initialState);
  }

  function setUpAfterRequestSuccess(context, initialState, url, options = { body: {} }) {
    fetchMock.get(url, options);

    setupState(context, initialState);
  }

  function setUpAfterRequestFailure(context, initialState, url, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.get(url, options);

    setupState(context, initialState);
  }

  function setupState(context, initialState) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.fetchUser());
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
