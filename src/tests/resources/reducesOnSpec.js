import fetchMock from 'fetch-mock';

import { resources, SUCCESS, RESOURCES } from '../../index';
import buildStore from '../helpers/buildStore';
import EmptyKey from '../../constants/EmptyKey';
import { expectToChangeResourcesItemValuesTo } from '../helpers/resourceAssertions';

const RESOURCE_NAME = 'users';

describe('reducesOn:', function () {
  beforeAll(function () {
    this.initialState = {
      users: {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob',
              signedIn: true,
            },
            status: { type: SUCCESS }
          },
        },
        lists: {
          [EmptyKey]: {
            positions: [ 1 ],
            status: { type: SUCCESS }
          }
        },
      },
      session: {
        ...RESOURCES,
        items: {
          1: {
            values: {
              active: true
            },
            status: { type: SUCCESS }
          }
        }
      }
    };

    const { reducers: sessionReducers, actionCreators: { destroyItem: destroySession }, actions } = resources({
      name: 'session',
      url: 'http://test.com/session/:id',
    }, {
      destroyItem: true
    });

    this.sessionReducers = sessionReducers;
    this.destroySession = destroySession;
    this.sessionActions = actions;

    fetchMock.delete('http://test.com/session/1', {
      body: {
        status: 200,
        response: { }
      },
      status: 200
    });

    const {
      reducers: usersReducers,
    } = resources({
      name: 'users',
      url: 'http://test.com/users/:id?',
      keyBy: 'id',
      reducesOn: {
        [this.sessionActions.destroyItem]: (users, { key }, { mergeItemValues }) => mergeItemValues(users, key, { signedIn: false })
      }
    }, { fetchList: true, newItem: true, });

    this.store = buildStore({
      ...this.initialState
    }, {
      users: usersReducers,
      session: this.sessionReducers
    });
  });

  afterAll(function () {
    fetchMock.restore();
  });

  it('calls the specified reducer when the specified action occurs', function() {
    expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'signedIn', true);

    return this.store.dispatch(this.destroySession(1)).then(() => {
      expectToChangeResourcesItemValuesTo(this, RESOURCE_NAME, '1', 'signedIn', false);
    });
  });

});
