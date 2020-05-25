import fetchMock from 'fetch-mock';
import { resources, ERROR, FETCHING, SUCCESS, RESOURCES } from '../../../index';
import nop from '../../../utils/function/nop';
import {
  expectToChangeResourceCollectionPositionsTo,
  expectToChangeResourceCollectionStatusTo,
  expectToChangeResourcesCollectionStatusErrorOccurredAtToBeSet,
  expectToChangeResourcesItemStatusTo,
  expectToChangeResourcesItemValuesTo,
  expectToNotChangeResourceCollectionPositions,
  expectToNotChangeResourcesItemStatus, expectToNotChangeResourcesItemValues,
  resourcesDefinition,
  setupInitialState
} from '../../helpers/resourceAssertions';
import EmptyKey from '../../../constants/EmptyKey';

const RESOURCE_NAME = 'users';

describe('fetchCollection reducers:', function () {
  beforeAll(function() {
    const { reducers, actionCreators: { fetchCollection: fetchUsers } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
    }, {
      fetchCollection: true
    });

    this.fetchUsers = fetchUsers;
    this.reducers = reducers;
  });

  describe('Given no actions have come before it', () => {
    describe('When the action creator is not passed any params', function(){
      expectToHandleSuccessAndFailure({ url: 'http://test.com/users', collectionId: EmptyKey });
    });

    describe('When the action creator is not passed params', function(){
      expectToHandleSuccessAndFailure({ url: 'http://test.com/users/newest', params: 'newest', collectionId: 'newest' });
    });
  });

  describe('Given an INDEX actions has come before it', () => {
    describe('When the action creator is not passed any params', function(){
      expectToHandleSuccessAndFailure({ url: 'http://test.com/users', collectionId: EmptyKey });
    });

    describe('When the action creator is not passed params', function(){
      expectToHandleSuccessAndFailure({ url: 'http://test.com/users/newest', params: 'newest', collectionId: 'newest' });
    });
  });

  describe('Given an INDEX action has come before it', function() {
    beforeAll(function () {
      this.itemId = 1;
      this.collectionId = EmptyKey;

      this.initialState = {
        items: {
          [this.itemId]: {
            values: {
              id: this.itemId,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        },
        collections: {
          [EmptyKey]: {
            positions: [ this.itemId ],
            status: { type: SUCCESS }
          }
        }
      };
    });

    describe('When the action creator is called and before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, this.initialState, 'http://test.com/users');
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the collection\'s status to fetching', function() {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'type', FETCHING);
      });

      it('then does NOT clear the collection\'s positions', function() {
        expectToNotChangeResourceCollectionPositions(this, RESOURCE_NAME, this.collectionId);
      });

      it('then does NOT clear the collection\'s items', function() {
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.itemId);
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.itemId);
      });
    });

    describe('When the API request succeeds', function() {
      beforeAll(function () {
        this.newValues = [{ id: 2, username: 'Jane' }];

        setUpAfterRequestSuccess(this, this.initialState, 'http://test.com/users', undefined, { body: this.newValues, });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the collection\'s status type to SUCCESS', function() {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'type', SUCCESS);
      });

      it('then replaces the item keys in the collection\'s positions with the new ones', function() {
        expectToChangeResourceCollectionPositionsTo(this, RESOURCE_NAME, this.collectionId,
          this.newValues.map(({ id }) => id)
        );
      });

      it('then adds items returned in the response not already in the store', function() {
        this.newValues.forEach((item) => {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, item.id, item);
        });
      });

      it('then sets the items status to SUCCESS', function() {
        this.newValues.forEach((item) => {
          expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, item.id, 'type', SUCCESS);
        });
      });
    });

    describe('When the API request errors', function() {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(this, this.initialState, 'http://test.com/users', undefined, this.options);
      });

      afterAll(function() {
        tearDown(this);
      });

      it('then changes the collection\'s status to ERROR', function() {
        expect(this.store.getState().users.collections[EmptyKey].status.type).toEqual(ERROR);
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'type', ERROR);
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'httpCode', this.options.status);
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'error', { message: this.options.body.error });
      });

      it('then sets the syncedAt attribute', function() {
        expectToChangeResourcesCollectionStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, this.collectionId);
      });

      it('then does NOT change the collection\'s positions', function() {
        expectToNotChangeResourceCollectionPositions(this, RESOURCE_NAME, this.collectionId);
      });

      it('then does NOT update any of the items', function() {
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.itemId);
      });
    });
  });

  describe('Given a SHOW action has come before it', function () {
    beforeAll(function () {
      this.itemId = 1;
      this.collectionId = EmptyKey;

      this.initialState = {
        items: {
          [this.itemId]: {
            values: {
              id: this.itemId,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        },
        collections: {}
      };
    });

    describe('When the action creator is called and before the request has completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, this.initialState, 'http://test.com/users');
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then does NOT clear the collection\'s items', function() {
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.itemId);
      });
    });

    describe('When the API request succeeds', function() {
      beforeAll(function () {
        this.newValues = [
          { id: 1, username: 'Robert' },
          { id: 2, username: 'Jane' }
        ];

        setUpAfterRequestSuccess(this, this.initialState, 'http://test.com/users', undefined, { body: this.newValues, });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then updates any items fetched using SHOW that are in the response', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.itemId, this.newValues[0]);
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.itemId, 'type', SUCCESS);
      });

      it('then adds any new items in the response that were not already in the store', function() {
        expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, this.newValues[1].id, this.newValues[1]);
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, this.newValues[1].id, 'type', SUCCESS);
      });

    });

    describe('When the API request errors', function() {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(this, this.initialState, 'http://test.com/users', undefined, this.options);
      });

      afterAll(function() {
        tearDown(this);
      });

      it('then does NOT update any items', function() {
        expectToNotChangeResourcesItemValues(this, RESOURCE_NAME, this.itemId);
        expectToNotChangeResourcesItemStatus(this, RESOURCE_NAME, this.itemId);
      });

    });
  });

  describe('Given an fetchCollection action that will succeed with a response that specifies \'error\' at the top level', () => {
    describe('when the request has completed', () => {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 200
        };

        this.collectionId = EmptyKey;

        setUpAfterRequestFailure(this, this.initialState, 'http://test.com/users', undefined, this.options);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the errors of the collection', function() {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'error', this.options.body.error);
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'errors', [this.options.body.error]);
      });
    });
  });

  describe('Given an fetchCollection action that will fail with a response that specifies \'errors\' at the top level', () => {
    describe('when the request has completed', () => {
      beforeAll(function () {
        this.options = {
          body: { errors: ['Not Found'] },
          status: 200
        };

        this.collectionId = EmptyKey;

        setUpAfterRequestFailure(this, this.initialState, 'http://test.com/users', undefined, this.options);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then sets the errors of the collection', function() {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'error', this.options.body.errors[0]);
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, this.collectionId, 'errors', this.options.body.errors);
      });
    });
  });

  function expectToHandleSuccessAndFailure({ url, initialState = { ...RESOURCES }, params, collectionId }) {
    describe('and is not yet completed', function () {
      beforeAll(function () {
        setUpBeforeRequest(this, initialState, url, params);
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then adds a default collection with a status type of fetching', function () {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, collectionId, 'type', FETCHING);
      });

      it('then adds a default collection with an empty list of positions', function () {
        expect(this.store.getState().users.collections[collectionId].positions).toEqual([]);
        expectToChangeResourceCollectionPositionsTo(this, RESOURCE_NAME, collectionId, []);
      });
    });

    describe('and the API request succeeds', function () {
      beforeAll(function () {
        this.newValues = [{ id: 1, username: 'Bob' }];

        setUpAfterRequestSuccess(this, { ...RESOURCES }, url, params, {
          body: this.newValues,
        });
      });

      afterAll(function () {
        tearDown(this);
      });

      it('then changes the collection\'s status type to SUCCESS', function () {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, collectionId, 'type', SUCCESS);
      });

      it('then indexes the returned items according to the keyBy option and places their keys in positions', function () {
        expectToChangeResourceCollectionPositionsTo(this, RESOURCE_NAME, collectionId, this.newValues.map(({ id }) => id));
      });

      it('then adds the returned items to the resource and keys them according to the keyBy option', function () {
        this.newValues.forEach((newValues) => {
          expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, newValues.id, newValues);
        });
      });

      it('then sets the items status to SUCCESS', function () {
        expectToChangeResourcesItemStatusTo(this, RESOURCE_NAME, 1, 'type', SUCCESS);
      });
    });

    describe('and the API request errors', function() {
      beforeAll(function () {
        this.options = {
          body: { error: 'Not Found' },
          status: 404
        };

        setUpAfterRequestFailure(this, { ...RESOURCES }, url, params, this.options);
      });

      afterAll(function() {
        tearDown(this);
      });

      it('then changes the collection\'s status', function() {
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, collectionId, 'type', ERROR);
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, collectionId, 'error', { message: this.options.body.error });
        expectToChangeResourceCollectionStatusTo(this, RESOURCE_NAME, collectionId, 'httpCode', this.options.status);
      });

      it('then sets the syncedAt attribute', function() {
        expectToChangeResourcesCollectionStatusErrorOccurredAtToBeSet(this, RESOURCE_NAME, collectionId);
      });

      it('then does not set the positions', function() {
        expectToChangeResourceCollectionPositionsTo(this, RESOURCE_NAME, collectionId, []);
      });

      it('then does not add any items', function() {
        expect(resourcesDefinition(this, RESOURCE_NAME).items).toEqual({});
      });
    });
  }

  function setUpBeforeRequest(context, initialState, url, params = undefined) {
    fetchMock.get(url, new Promise(nop));

    setupState(context, initialState, params);
  }

  function setUpAfterRequestSuccess(context, initialState, url, params = undefined, options = { body: {} }) {
    fetchMock.get(url, options);

    setupState(context, initialState, params);
  }

  function setUpAfterRequestFailure(context, initialState, url, params, options = { body: { error: 'Not Found' }, status: 404 }) {
    fetchMock.get(url, options);

    setupState(context, initialState, params);
  }

  function setupState(context, initialState, params = undefined) {
    setupInitialState(context, RESOURCE_NAME, initialState);

    if (params) {
      context.store.dispatch(context.fetchUsers(params));
    } else {
      context.store.dispatch(context.fetchUsers());
    }
  }

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
