import fetchMock from 'fetch-mock';
import { resource, RESOURCES, CREATING, ERROR, NEW, SUCCESS } from '../../../index';
import nop from '../../../utils/function/nop';
import {
  expectToChangeNewItemKeyTo, expectToChangeResourceItemStatusErrorOccurredAtToBeSet,
  expectToChangeResourceItemStatusTo,
  expectToChangeResourceItemValuesTo,
  expectToNotChangeResourcesCollection,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('Create reducer:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { createUser } } = resource({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id'
    }, {
      create: true
    });

    this.createUser = createUser;
    this.reducers = reducers;

    this.newValues = { username: 'Bob' };
    this.responseValues = { ...this.newValues, id: 1 };
  });

  describe('Given no actions have come before it', () => {
    expectToHandleSuccessAndFailedRequests({ ...RESOURCES });
  });

  describe('Given a NEW action has come before it', () => {
    expectToHandleSuccessAndFailedRequests({
      items: {
        [EmptyKey]: {
          values: { username: 'Robert' },
          status: { type: NEW }
        }
      },
      collections: { },
      newItemKey: EmptyKey
    });
  });

  describe('when there is already an item in the store with the same key', function () {
    describe('before the request has completed', function () {
      beforeAll(function(){
        spyOn(console, 'warn');

        setUpBeforeRequest(this, {
          items: {
            [EmptyKey]: {
              values: { username: 'Robert' },
              status: { type: SUCCESS }
            }
          },
          collections: {
            [EmptyKey]: {
              positions: [ 1 ],
              status: { type: null }
            }
          },
          newItemKey: null
        }, 1, this.newValues);
      });

      it('then replaces the existing item\'s values', function() {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
      });

      it('then sets the status of the existing item to CREATING', function() {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', CREATING);
      });

      it('then sets the newItemKey to the temporary key', function() {
        expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
      });

      afterAll(() => tearDown(this));
    });

    describe('when the request has completed', () => {
      beforeAll(function () {

        /**
         * Spy isn't actually used - just prevents warning from showing in test output
         */
        spyOn(console, 'warn');

        this.responseValues = { id: 2, username: 'Bob' };

        setUpAfterRequestSuccess(this, {
          users: {
            items: {
              1: {
                values: { username: 'Robert' },
                status: { type: SUCCESS }
              }
            },
            collections: {
              [EmptyKey]: {
                positions: [ 1 ],
                status: { type: null }
              }
            },
            newItemKey: null
          }
        }, 1, this.newValues, this.responseValues);
      });

      afterAll(() => tearDown(this));

      it('then moves the item to the new ID and merges in values from the server', function() {
        expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.responseValues);
      });

      it('then sets the items status type to SUCCESS', function() {
        expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', SUCCESS);
      });

      it('then updates the newItemKey ', function() {
        expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
      });
    });
  });

  describe('Given a create action that will succeed with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      expectToCorrectlySetErrors(404);
    });
  });

  describe('Given a create action that will fail with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      expectToCorrectlySetErrors(200);
    });
  });

  /**
   * Helpers
   */

  function expectToHandleSuccessAndFailedRequests(initialState) {
    describe('and the API request succeeds', function () {
      describe('before the request has completed', function () {
        beforeAll(function () {
          setUpBeforeRequest(this, initialState, this.newValues);
        });

        expectToRecordPendingCreate();

        afterAll(() => tearDown(this));
      });

      describe('when the request has completed', () => {
        beforeAll(function () {
          setUpAfterRequestSuccess(this, initialState, this.newValues, this.responseValues);
        });

        expectToRecordCreateSuccess();

        afterAll(() => tearDown(this));
      });
    });

    describe('and the API request errors', function () {
      describe('before the request has completed', function () {
        beforeAll(function () {
          setUpBeforeRequest(this, initialState, this.newValues);
        });

        expectToRecordPendingCreate();

        afterAll(() => tearDown(this));
      });

      describe('when the request has completed', () => {
        beforeAll(function () {
          setUpAfterRequestFailure(this, initialState, this.newValues);
        });

        expectToRecordCreateError();

        afterAll(() => tearDown(this));
      });
    });
  }

  function expectToRecordCreateSuccess() {
    it('then moves the item to the new ID and merges in values from the server', function() {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, { id: 1, username: 'Bob', });
    });

    it('then sets the items status type to SUCCESS', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', SUCCESS);
    });

    it('then updates the newItemKey ', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
    });
  }

  function expectToRecordPendingCreate() {
    it('then adds a new item with the correct values', function() {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, { username: 'Bob' });
    });

    it('then adds a new item with a status type of CREATING', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', CREATING);
    });

    it('then does NOT add the temporary key to the default collection', function() {
      expectToNotChangeResourcesCollection(this, RESOURCE_NAME, EmptyKey);
    });

    it('then sets the newItemKey to the temporary key', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
    });
  }

  function expectToRecordCreateError() {
    it('then DOES NOT move the item from its temporary key', function() {
      expectToChangeResourceItemValuesTo(this, RESOURCE_NAME, this.newValues);
    });

    it('then sets the items status type to ERROR', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', ERROR);
    });

    it('then sets the items status httpCode', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', 404);
    });

    it('then sets the syncedAt attribute', function() {
      expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
    });

    it('then merges in the server\'s response into the status', function() {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'error', { message: 'Not Found' });
    });

    it('then DOES NOT update the newItemKey', function() {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
    });
  }

  function expectToCorrectlySetErrors(status = 200) {
    beforeAll(function () {
      this.newValues = { username: 'Bob' };

      setUpAfterRequestFailure(this, { ...RESOURCES }, this.newValues, {
        body: { errors: [{ message: 'Not Found' }] },
        status
      });
    });

    afterAll(function(){
      tearDown(this);
    });

    it('then DOES NOT move the item from its temporary key', function () {
      expect(this.store.getState().users.items[EmptyKey].values).toEqual(this.newValues);
    });

    it('then sets the items status type to ERROR', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'type', ERROR);
    });

    it('then sets the items status httpCode', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'httpCode', status);
    });

    it('then does NOT set the syncedAt attribute', function () {
      expectToChangeResourceItemStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME);
    });

    it('then merges in the server\'s response into the status', function () {
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'error', { message: 'Not Found' });
      expectToChangeResourceItemStatusTo(this, RESOURCE_NAME, 'errors', [{ message: 'Not Found' }]);
    });

    it('then DOES NOT update the newItemKey', function () {
      expectToChangeNewItemKeyTo(this, RESOURCE_NAME, EmptyKey);
    });
  }

  function setUpBeforeRequest(context, initialState, newValues, actionCreatorOptions = {}) {
    fetchMock.post('http://test.com/users', new Promise(nop));

    setupState(context, initialState, newValues, actionCreatorOptions);
  }

  function setUpAfterRequestSuccess(context, initialState, initialValues,
                                    responseValues = initialValues, actionCreatorOptions = {}) {
    fetchMock.post('http://test.com/users', {
      body: responseValues,
    });

    setupState(context, initialState, initialValues, actionCreatorOptions);
  }

  function setUpAfterRequestFailure(context, initialState, newValues, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.post('http://test.com/users', options);

    setupState(context, initialState, newValues);
  }

  function setupState(context, initialState, newValues, actionCreatorOptions = {}) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    context.store.dispatch(context.createUser(newValues, actionCreatorOptions));
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
