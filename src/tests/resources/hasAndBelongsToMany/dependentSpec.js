import fetchMock from 'fetch-mock';
import { resources, RESOURCES, SUCCESS } from '../../../index';
import buildStore from '../../helpers/buildStore';

describe('hasAndBelongsToMany:', function () {
  beforeAll(function () {
    this.initialState = {
      users: {
        items: {
          1: {
            values: {
              id: 1,
              username: 'Bob',
              addressIds: [ 1 ]
            },
            status: { type: SUCCESS }
          },
        },
        collections: {
          '': {
            positions: [ 1 ],
            status: { type: SUCCESS }
          }
        },
        selectionMap: { 1: true },
        newItemKey: null
      },
      addresses: {
        ...RESOURCES,
        items: {
          1: {
            values: {
              userIds: [ 1 ]
            },
            status: { type: SUCCESS }
          }
        }
      }
    };
  });

  describe('when the \'dependent\' option is \'destroy\'', function () {

    beforeAll(function () {

      /**
       * @type {{ actions, reducers, destroyAddress }}
       */
      this.addresses = resources({
        name: 'addresses',
        url: 'http://test.com/addresses/:id?',
        keyBy: 'id'
      }, { destroy: true });

      const {
        reducers,
      } = resources({
        name: 'users',
        url: 'http://test.com/users/:id?',
        keyBy: 'id',
        hasAndBelongsToMany: {
          addresses: {
            ...this.addresses,
            dependent: 'destroy'
          },
        }
      }, {
        new: true,
      });

      this.reducers = reducers;
    });

    describe('and the previous values are included in the destroy action', function () {
      beforeAll(function () {
        fetchMock.delete('http://test.com/addresses/1', {
          body: { },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({ ...this.initialState }, {
          users: this.reducers,
          addresses: this.addresses.reducers
        });

        this.store.dispatch(this.addresses.actionCreators.destroyAddress(1, { userIds: [ 1 ], city: 'City 3' }));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before a request to destroy an associated resource item has completed', function () {
        it('then does NOT remove the item', function() {
          expect(this.users.items[1]).toEqual(this.initialState.users.items[1]);
        });
      });

      describe('after a request to destroy an associated resource item has completed', () => {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then removes the item', function() {
          expect(this.users.items[1]).toEqual(undefined);
        });
      });
    });

    describe('and the previous values are NOT included in the destroy action', function () {
      beforeAll(function () {
        fetchMock.delete('http://test.com/addresses/1', {
          body: { },
        }, new Promise((resolve) => {
          this.resolveRequest = resolve;
        }));

        this.store = buildStore({ ...this.initialState }, {
          users: this.reducers,
          addresses: this.addresses.reducers
        });

        spyOn(console, 'warn');

        this.store.dispatch(this.addresses.actionCreators.destroyAddress(1));

        this.users = this.store.getState().users;
      });

      afterAll(function() {
        fetchMock.restore();
      });

      describe('before a request to destroy an associated resource item has completed', function () {
        it('then does NOT remove the item', function() {
          expect(this.users.items[1]).toEqual(this.initialState.users.items[1]);
        });

        it('then displays a warning', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith(
            'Redux and the REST: DESTROY_ADDRESS did no specify any previous values. This makes updating \'users.addressIds\' much less efficient. Provide the values of the item you are destroying as the second argument to destroy*().'
          );
        });
      });

      describe('after a request to destroy an associated resource item has completed', () => {
        beforeAll(function () {
          this.resolveRequest();

          this.users = this.store.getState().users;
        });

        it('then removes the item', function() {
          expect(this.users.items[1]).toEqual(undefined);
        });
      });
    });

  });
});
