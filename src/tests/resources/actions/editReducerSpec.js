import buildStore from '../../helpers/buildStore';
import { resources, EDITING, ERROR, NEW, SUCCESS } from '../../../index';

describe('Edit reducer:', function () {
  beforeAll(function () {
    const { reducers, editUser } = resources({
      name: 'users',
      keyBy: 'id'
    }, {
      edit: true
    });

    this.editUser = editUser;
    this.reducers = reducers;

    this.resourceBefore = {
      collections: {},
      selectionMap: { },
      newItemKey: null
    };
  });

  [
    {
      idArgsDescription: 'when only the item\'s id is passed to the action creator',
      idArgs: 1
    },
    {
      idArgsDescription: 'when the item\'s id is passed as an object to the action creator',
      idArgs: { id: 1 }
    }
  ].forEach(({ idArgsDescription, idArgs }) => {
    describe(idArgsDescription, () => {
      describe('and there is no existing item', function () {
        beforeAll(function () {
          this.store = buildStore({ users: { ...this.resourceBefore, items: {} } }, { users: this.reducers } );

          spyOn(console, 'warn');

          this.store.dispatch(this.editUser(idArgs, { username: 'Bob' }));

          this.users = this.store.getState().users;
        });

        it('then warns about the missing item', function() {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledWith('Redux and the REST: EDIT_USER\'s key \'1\' does not match any items in the store. Use a new*() to create a new item or check the arguments passed to edit*(). (A new item was created to contain the edit.)');
        });

        it('then adds an item with the correct values', function() {
          expect(this.users.items[1].values).toEqual({ username: 'Bob' });
        });

        it('then adds an item with a status of EDITING', function() {
          expect(this.users.items[1].status.type).toEqual(EDITING);
        });
      });

      describe('and the resource is in the store', function () {
        [
          {
            description: 'and it has a status of NEW',
            status: { type: NEW }
          },
          {
            description: 'and it has a status of SUCCESS',
            status: { type: SUCCESS }
          },
          {
            description: 'and it has a status of ERROR',
            status: { type: ERROR, error: { code: 'INVALID_RESOURCE' } }
          },
        ].forEach(function({ description, status }) {
          describe(description, function() {
            beforeAll(function () {
              this.store = buildStore({
                users: {
                  ...this.resourceBefore,
                  items: {
                    1: {
                      values: { username: 'Robert' },
                      status
                    }
                  }
                }
              }, { users: this.reducers } );

              this.store.dispatch(this.editUser(idArgs, { username: 'Bob' }));

              this.users = this.store.getState().users;
            });

            it('then updates the item\'s values', function() {
              expect(this.users.items[1].values).toEqual({ username: 'Bob' });
            });

            it('then changes the item\'s status to EDITING', function() {
              expect(this.users.items[1].status).toEqual({ type: EDITING });
            });
          });
        });
      });
    });
  });
});