import fetchMock from 'fetch-mock';

import { resources, configure, getConfiguration } from '../../index';
import buildStore from '../helpers/buildStore';
import nop from '../../utils/function/nop';

describe('Request options:', () => {
  afterEach(function () {

    // noinspection JSCheckFunctionSignatures
    /**
     * Reset the configuration to avoid bleeding into other tests
     */
    configure({});
  });

  beforeAll(function() {
    this.originalHeaders = {
      'Content-Type': 'application/json+custom',
      'Accept': 'application/json+custom'
    };
  });

  afterEach(function() {
    fetchMock.restore();
    this.store = null;
  });

  describe('Given the request options have been globally configured BEFORE a resource has been defined', () => {
    beforeEach(function () {
      configure({ request: { headers: this.originalHeaders } });

      defineResources(this);
    });

    describe('when an action creator is called', () => {
      it('then uses the request options', function() {
        checkRequestIsMadeWithHeaders(this.originalHeaders, this);
      });
    });
  });

  describe('Given the request options have been globally configured AFTER a resource has been defined', () => {
    beforeEach(function () {
      defineResources(this);
      configure({ request: { headers: this.originalHeaders } });
    });

    describe('when an action creator is called', () => {
      it('then uses the request options', function() {
        checkRequestIsMadeWithHeaders(this.originalHeaders, this);
      });
    });
  });

  describe('Given the request options have been globally configured at runtime', () => {
    beforeEach(function () {
      configure({ request: { headers: this.originalHeaders } });

      defineResources(this);

      const configuration = getConfiguration();

      this.runtimeHeaders = {
        ...configuration.request.headers,
        'Authorization': 'Token token="MY-TOKEN"'
      };

      // Sometime later at runtime

      configure({
        request: {
          headers: this.runtimeHeaders
        }
      });
    });

    describe('when an action creator is called', () => {
      it('then uses the request options', function() {
        checkRequestIsMadeWithHeaders(this.runtimeHeaders, this);
      });
    });
  });

  function defineResources(context) {
    const { reducers, actionCreators: { fetchCollection: fetchUsers } } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
    }, ['index']);

    context.fetchUsers = fetchUsers;
    context.reducers = reducers;
  }

  function checkRequestIsMadeWithHeaders(headers, context) {
    fetchMock.get('http://test.com/users', new Promise(nop), { headers });

    context.store = buildStore({ users: context.resourceBefore }, { users: context.reducers } );

    context.store.dispatch(context.fetchUsers());
  }
});
