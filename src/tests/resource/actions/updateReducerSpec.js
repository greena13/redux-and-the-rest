import fetchMock from 'fetch-mock';
import { resource, ERROR, SUCCESS, UPDATING, RESOURCES, EDITING } from '../../../index';
import nop from '../../../utils/function/nop';
import {
  expectToChangeResourceItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourceItemStatusTo,
  expectToChangeResourceItemValuesTo, expectToNotChangeResourceItemStatus, expectToNotChangeResourceItemValues,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Update reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { updateUser } } = resource({
      name: 'users',
      url: 'http://test.com/users/:id?',
    }, {
      update: true
    });

    this.updateUser = updateUser;
    this.reducers = reducers;

    this.newValues = { username: 'Robert' };
    this.serverValues = { id: 1, username: 'Robert', approved: false };
  });

  describe('Given the resource is NOT in the store', function () {
    describe('when the action creator is called and before the request has completed', function () {
      beforeAll(function () {
        spyOn(console, 'warn');

        setUpBeforeRequest(this, { ...RESOURCES }, 'http://test.com/users');
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then warns about trying to update an item not in the store', function() {
        // eslint-disable-next-line no-console
        expect(console.warn).toHaveBeenCalledWith(`Redux and the REST: UPDATE_USER\'s key \'${EmptyKey}\' did not match any items in the store. Check the arguments passed to updateUser(). (Update request still sent to the server.)`);
      });

      it('then adds a new item with a status of UPDATING', function() {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', UPDATING);
      });

      it('then adds a new item with values specified', function() {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
      });
    });

    describe('when the API request succeeds', function() {
      beforeAll(function () {
        spyOn(console, 'warn');

        setUpAfterRequestSuccess(this, { ...RESOURCES }, 'http://test.com/users', this.newValues, {
          body: this.serverValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to SUCCESS', function() {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', SUCCESS);
      });

      it('then sets the item\'s values from the response', function() {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.serverValues);
      });
    });
  });

  describe('Given the resource is in the store', () => {
    const resourceBefore = {
      items: {
        [EmptyKey]: {
          values: { username: 'Bob', id: 1 },
          status: { type: SUCCESS }
        }
      },
    };

    expectToCorrectlyUpdateItemInStore({ ...RESOURCES, ...resourceBefore });
  });

  describe('Given the resource item has been edited previously', () => {
    const resourceBefore = {
      items: {
        [EmptyKey]: {
          values: { username: 'Bob', id: 1 },
          status: {
            type: EDITING,
            dirty: true,
            originalValues: { username: 'Bobert', id: 1 }
          }
        }
      },
    };

    expectToCorrectlyUpdateAnEditedResourceItem({ ...RESOURCES, ...resourceBefore });
  });

  describe('Given a update action that will succeed with a response that specifies \'errors\' at the top level', () => {
    expectToMergeInMultipleErrors({ body: { errors: ['Not Found'] }, status: 200 });
  });

  describe('Given a update action that will fail with a response that specifies \'errors\' at the top level', () => {
    expectToMergeInMultipleErrors({ body: { errors: ['Not Found'] }, status: 400 });
  });

  function expectToCorrectlyUpdateItemInStore(initialState) {
    describe('when the action creator is called and before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, 'http://test.com/users');
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the item\'s status type to UPDATING', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', UPDATING);
      });

      it('then merges in the new values with the item\'s old ones', function () {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
      });
    });

    describe('when the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState, 'http://test.com/users', this.newValues, {
          body: this.serverValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to SUCCESS', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, SUCCESS);
      });

      it('then sets the item\'s values from the response', function () {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.serverValues);
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
          'http://test.com/users',
          this.options
        );
      });

      afterAll(function () {
        tearDown(this);
      });

      expectToHandleErrorResponse();
    });
  }

  function expectToCorrectlyUpdateAnEditedResourceItem(initialState) {
    describe('before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, 'http://test.com/users');
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the item\'s status type to UPDATING', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', UPDATING);
      });

      it('then does NOT unset the dirty bit', function () {
        expectToNotChangeResourceItemStatus(this, RESOURCE_NAME, 'dirty');
      });

      it('then does NOT clear the originalValues', function () {
        expectToNotChangeResourceItemStatus(this, RESOURCE_NAME, 'originalValues');
      });

      it('then merges in the new values with the item\'s old ones', function () {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
      });
    });

    describe('and the API request succeeds', function () {
      beforeAll(function () {
        setUpAfterRequestSuccess(this, initialState, 'http://test.com/users', this.newValues, {
          body: this.serverValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to SUCCESS', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', SUCCESS);
      });

      it('then removes the dirty bit', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'dirty', undefined);
      });

      it('then clears the original values', function () {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'originalValues', undefined);
      });

      it('then sets the item\'s values from the response', function () {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.serverValues);
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
          'http://test.com/users',
          this.options
        );
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then does NOT unset the dirty bit', function () {
        expectToNotChangeResourceItemStatus(this, RESOURCE_NAME, 'dirty');
      });

      it('then does NOT clear the originalValues', function () {
        expectToNotChangeResourceItemStatus(this, RESOURCE_NAME, 'originalValues');
      });

      expectToHandleErrorResponse();
    });
  }

  function expectToHandleErrorResponse() {
    it('then changes the items\'s status type to ERROR', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', ERROR);
    });

    it('then sets the syncedAt attribute', function () {
      expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
    });

    it('then updates the item\'s status httpCode', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', this.options.status);
    });

    it('then does not update the values from the response', function () {
      expectToNotChangeResourceItemValues(this, RESOURCE_NAME);
    });

    it('then sets the status error from the response', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'error', { message: this.options.body.error });
    });
  }

  function expectToMergeInMultipleErrors(options) {
    describe('when the request has completed', function () {
      beforeAll(function () {
        setUpAfterRequestFailure(this, { ...RESOURCES, items: {
            [EmptyKey]: {
              values: { username: 'Bob', id: 1 },
              status: { type: SUCCESS }
            }
          }, }, 'http://test.com/users', options);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the items\'s status type to ERROR', function() {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', ERROR);
      });

      it('then sets the syncedAt attribute', function() {
        expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
      });

      it('then updates the item\'s status httpCode', function() {
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
    fetchMock.put(url, new Promise(nop));

    setupState(context, initialState);
  }

  function setUpAfterRequestSuccess(context, initialState, url, values, options = { body: {} }) {
    fetchMock.put(url, options);

    setupState(context, initialState, values);
  }

  function setUpAfterRequestFailure(context, initialState, url, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.put(url, options);

    setupState(context, initialState);
  }

  function setupState(context, initialState, values) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.updateUser(values));
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
