import fetchMock from 'fetch-mock';
import { resources } from '../../../index';
import nop from '../../utils/function/nop';
import {
  resourceDefinition, resourcesDefinition,
  setupInitialState,
} from '../helpers/resourceAssertions';
import { CREATING, ERROR, ITEM, RESOURCES, SUCCESS } from '../..';
import getNewItem from '../../public-helpers/getNewItem';

const RESOURCE_NAME = 'users';

describe('getNewItem:', function () {
  beforeAll(function() {
    this.url = 'http://test.com/users/:id';

    const { reducers, actionCreators } = resources({
      name: 'users',
      url: this.url,
      keyBy: 'id',
    }, ['newItem', 'createItem']);

    this.actionCreators = actionCreators;
    this.reducers = reducers;
  });

  describe('Given there is no new item', () => {
    beforeAll(function () {
      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });
    });

    it('then returns an empty item', function() {
      expect(getNewItem(resourceDefinition(this, RESOURCE_NAME))).toEqual(ITEM);
    });
  });

  describe('Given a new item is being worked on', () => {
    describe('and no id is passed to the action creator', () => {
      beforeAll(function () {
        this.values = {
          username: 'Bob'
        };

        setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

        this.store.dispatch(this.actionCreators.newItem(this.values));
      });

      it('then returns the new item', function() {
        expect(getNewItem(resourcesDefinition(this, RESOURCE_NAME)).values).toEqual(this.values);
      });
    });

    describe('and an id is passed to the action creator', () => {
      beforeAll(function () {
        this.itemId = 'temp';
        this.values = { username: 'Bob' };

        setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

        this.store.dispatch(this.actionCreators.newItem(this.itemId, this.values));
      });

      it('then returns the new item', function() {
        expect(getNewItem(resourcesDefinition(this, RESOURCE_NAME)).values).toEqual(this.values);
      });
    });
  });

  describe('Given the new item is creating', () => {
    beforeAll(function () {
      this.itemId = 'temp';
      this.values = { username: 'Bob' };

      fetchMock.post(`http://test.com/users/${this.itemId}`, new Promise(nop));

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.createItem(this.itemId, this.values));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns the new item', function() {
      const newItem = getNewItem(resourcesDefinition(this, RESOURCE_NAME));

      expect(newItem.values).toEqual(this.values);
      expect(newItem.status.type).toEqual(CREATING);
    });
  });

  describe('Given the new item has just been created', () => {
    beforeAll(function () {
      this.itemId = 'temp';
      this.newId = 1;
      this.values = { username: 'Bob', id: this.newId };

      fetchMock.post(`http://test.com/users/${this.itemId}`, { body: this.values });

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.createItem(this.itemId, this.values));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns the new item', function() {
      const _resources = resourcesDefinition(this, RESOURCE_NAME);

      // Check item has moved to new key
      expect(_resources.newItemKey).toEqual(this.newId);

      const newItem = getNewItem(_resources);

      expect(newItem.values).toEqual(this.values);
      expect(newItem.status.type).toEqual(SUCCESS);
    });
  });

  describe('Given the new item has just failed to create', () => {
    beforeAll(function () {
      this.itemId = 'temp';
      this.values = { username: 'Bob' };

      fetchMock.post(`http://test.com/users/${this.itemId}`, { body: { error: 'Unauthorized' }, status: 401 });

      setupInitialState(this, RESOURCE_NAME, { ...RESOURCES });

      this.store.dispatch(this.actionCreators.createItem(this.itemId, this.values));
    });

    afterAll(function() {
      tearDown(this);
    });

    it('then returns the new item', function() {
      const newItem = getNewItem(resourcesDefinition(this, RESOURCE_NAME));

      expect(newItem.values).toEqual(this.values);
      expect(newItem.status.type).toEqual(ERROR);
    });
  });

  function tearDown(context) {
    fetchMock.restore();
    context.store = null;
  }
});
