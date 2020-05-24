import fetchMock from 'fetch-mock';
import { resources } from '../../../index';
import nop from '../../utils/function/nop';
import { resourcesItem, setupInitialState, } from '../helpers/resourceAssertions';
import { getTimeSinceFetchStarted, RESOURCES, SUCCESS } from '../..';

const RESOURCE_NAME = 'users';

describe('getTimeSinceFetchStarted:', function () {
  beforeAll(function() {
    this.urlBase = 'http://test.com/users';
    this.url = `${this.urlBase}/:id?`;

    const { reducers, actionCreators } = resources({
      name: 'users',
      url: this.url,
      keyBy: 'id',
    }, ['newItem', 'fetchItem', 'createItem', 'update']);

    this.actionCreators = actionCreators;
    this.reducers = reducers;
  });

  describe('Given there are no current outstanding remote API requests', () => {
    beforeAll(function () {
      this.itemId = 1;

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES, items: {
          [this.itemId]: {
            values: {
              id: this.itemId,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        }
      });
    });

    it('then returns 0', function() {
      expect(getTimeSinceFetchStarted(resourcesItem(this, RESOURCE_NAME, this.itemId))).toEqual(0);
    });
  });

  describe('Given the item is currently being fetched', () => {
    beforeAll(function () {
      this.itemId = 'temp';

      fetchMock.get(`${this.urlBase}/${this.itemId}`, new Promise(nop));

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.fetchItem(this.itemId));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns the time since the fetchItem started', function() {
      expect(getTimeSinceFetchStarted(resourcesItem(this, RESOURCE_NAME, this.itemId))).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Given the item has finished fetching', () => {
    beforeAll(function () {
      this.itemId = 1;
      this.values = { username: 'Bob', id: this.itemId };

      fetchMock.get(`${this.urlBase}/${this.itemId}`, { body: this.values });

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.fetchItem(this.itemId));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns 0', function() {
      expect(getTimeSinceFetchStarted(resourcesItem(this, RESOURCE_NAME, this.itemId))).toEqual(0);
    });
  });

  describe('Given the item has failed to fetchItem', () => {
    beforeAll(function () {
      this.itemId = 1;

      fetchMock.get(`${this.urlBase}/${this.itemId}`, { body: { error: 'Not Found' }, status: 404 });

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.fetchItem(this.itemId));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns 0', function() {
      expect(getTimeSinceFetchStarted(resourcesItem(this, RESOURCE_NAME, this.itemId))).toEqual(0);
    });
  });

  describe('Given the item is currently being created', () => {
    beforeAll(function () {
      this.itemId = 'temp';
      this.newItemId = 1;
      this.values = { username: 'Bob', id: this.newItemId };

      fetchMock.post(this.urlBase, new Promise(nop));

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.createItem(this.itemId, this.values));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns 0', function() {
      expect(getTimeSinceFetchStarted(resourcesItem(this, RESOURCE_NAME, this.itemId))).toEqual(0);
    });
  });

  describe('Given the item is currently being updated', () => {
    beforeAll(function () {
      this.itemId = 1;
      this.values = { username: 'Bob' };

      fetchMock.put(`${this.urlBase}/${this.itemId}`, new Promise(nop));

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES, items: {
          [this.itemId]: {
            values: {
              id: this.itemId,
              username: 'Bob'
            },
            status: { type: SUCCESS }
          }
        }
      });

      this.store.dispatch(this.actionCreators.updateItem(this.itemId, this.values));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns 0', function() {
      expect(getTimeSinceFetchStarted(resourcesItem(this, RESOURCE_NAME, this.itemId))).toEqual(0);
    });
  });

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
