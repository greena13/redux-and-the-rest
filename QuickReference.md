# redux-and-the-rest Cheat Sheet

This document is intended as a quick-reference for the most popular features of `redux-and-the-rest`. It's not necessarily complete, and is intended to be read in conjunction with the more comprehensive [Readme](README.md) file, where required.

## Basic example

`resources/users.js`:

```javascript
import { resources } from 'redux-and-the-rest';
           
// Define a users resource
const {  
  // Dispatchers
  getOrFetchList: getOrFetchUsers, 
  getOrFetchItem: getOrFetchUser, 
  saveItem: saveUser,
  destroyItem: destroyUser, 

  // Reducers
  reducers: usersReducers 
} = resource({
  url: 'http:s//example.com/api/v1/users/:id'          
}, {
  // Enable index, show, new, edit and destroy RESTful actions, respectively
  fetchList: true,
  fetchItem: true,
  newItem: true,
  editItem: true,
  destroyItem: true
})  
 
export default { 
  // Export the helpers you'll want to call in your application
  getOrFetchUsers,
  getOrFetchUser,
  saveUser,     
  destroyUser,                                            
  // Export the reducers you'll need to configure Redux with
  usersReducers
};
```

`store.js`:

```javascript
import { combineReducers, createStore, compose } from 'redux';
import { configure } from 'redux-and-the-rest';
import Thunk from 'redux-thunk';

import { usersReducers } from '../resources/users.js'    
                      
// Configure what part of the Redux store the resource's reducers should run on
const reducers = combineReducers({
  users: usersReducers 
});      

// Enable the redux-thunk Middleware                                        
const reduxMiddleware = applyMiddleware([Thunk]);
 
const store = createStore(reducers, {}, compose(reduxMiddleware))  
                  
// Configure redux-and-the-rest with a reference to your store
configure({ store });

export default store;  
```
   
`App.js`:
 
```javascript
import { Route } from 'react-router-dom'; 
import UsersIndexScreen from '../screens/users/UsersIndexScreen'
import UserShowScreen from '../screens/users/UserShowScreen'
import NewUserScreen from '../screens/users/NewUserScreen'
import EditUserScreen from '../screens/users/EditUserScreen'
           
// Configure RESTful routes
const App  = () => {
  return(
    <Switch>    
      <Route exact path='users'>
        <UsersIndexScreen /> 
      </Route> 

      <Route exact path='users/:id'>
        <UserShowScreen /> 
      </Route>

      <Route exact path='users/new'>
        <NewUserScreen /> 
      </Route>    

      <Route exact path='users/:id/edit'>
        <EditUserScreen /> 
      </Route>
    </>
  );
} 

export default App;
```

## Making the most of redux-and-the-rest

### RESTful actions

Structure your application so that it is conformant with the RESTful specification as possible:

#### index

URL

* Requires no URL parameters (unless a nested resource) e.g. `/users/`

Content

* Screen named something like `UsersIndexScreen`
* Displays the list of results - typically with the options to view, edit or destroy those items (these options may also only made available when viewing the item in the show page)
* Pagination, filtering/search and sorting links or UI may also be available and are encoded as URL query parameters, so each filter can be linked to directly

Helpers

* Calls `getOrFetchList()` to retrieve a list (possibly filtered, sorted or paginated) of results if it doesn't already exist in the store. You can also chose to use `fetchList()` if you want to always fetch the list anew, each time a component mounts, for example.

Preloader

* While fetching initial list (and each page or change of filter): `isFetching(list)` and then `isFinishedFetching(list)` and  `isSuccess(list)`
* May also need to fetch associated resources (e.g. current user)

Errors

* Errors with fetching the list (server error, unauthenticated, etc): `isFinishedFetching()` and `isError()` (and possibly `getHttpStatus()`)


Example:

```javascript
import React from 'react';        
import { isFetching, isFinishedFetching, isSuccess, isError } from 'redux-and-the-rest';
import { connect } from 'react-redux';
import { getOrFetchUsers } from '../../resources/users';

const UsersIndexScreen = ({ users }) => {
  if (isFetching(users)) {
    // Return preloader
  }                    

  if (isFinishedFetching(users)) {
    if (isError(users)) {
      // Return error, using users.status.error or possiblyg using getHttpStatus(users)
    } 
  
    if (isSuccess(users)) {
      return users.items.map(({ values }) => {
        // Render user in JSX
      }); 
    }
  }
}                                                               

const mapReduxStateToProps = ({ users }) => {
  return { 
    // Returns list of users from Redux store, or empty collection while they're being fetched
    users: getOrFetchUsers(users),
  };
}        

export default connect(mapReduxStateToProps)(UsersIndexScreen);
```

##### Searching, Sorting and Filtering

URL

* Values used to fetch and index your collections (such as sort, filter and pagination params) should be stored and retrieved from the current route’s url and query parameters: E.g. `/users?type=premium&status=confirmed`
* A user should be able to navigate to a particular route, have the correct components mount, which pass some or all of those parameters to `redux-and-the-rest` fetch helpers

Content

* Usually part of, or re-use your components and UI for the index route
* Typically provide the UI widgets for changing the current URL or its query parameters (which, because they’re then passed to `fetchList()` will cause the results of the new filter to be re-fetched)

Helpers

* Get the sort and filter params from the URL query parameter and pass them to `getOrFetchList(params)` - as long as they don’t match the resource action's url params, they’re encoded as query parameters on the request for the resource list, and are used to index where in the redux store the results are located (so you don’t have to worry about getting the wrong results if your filter changes)

Preloader

* While fetching initial list (and each change of filter): `isFetching(list)` and then `isFinishedFetching(list)` and `isSuccess(list)`

Errors

* Errors with fetching the list (server error, unauthenticated, etc): `isFinishedFetching()` and `isError()` (and possibly `getHttpStatus()`)

Example:

```javascript
import React from 'react';        
import { isFetching, isFinishedFetching, isSuccess, isError } from 'redux-and-the-rest';
import { connect } from 'react-redux'; 
import { withRouter } from 'react-router';            
import queryString from 'query-string';
import { getOrFetchUsers } from '../../resources/users';

const UsersIndexScreen = ({ users, queryParams, pathname }) => {
  if (isFetching(users)) {
    // Return preloader
  }                    

  if (isFinishedFetching(users)) {
    if (isError(users)) {
      // Return error, using users.status.error or possiblyg using getHttpStatus(users)
    } 
  
    if (isSuccess(users)) {
      return(
        <>
          <Link
            to={{ pathname, search: queryString.stringify({ ...queryParams, archived: 1 }) }} 
          > 
           Show archived
          </Link>
          
          {
            users.items.map(({ values }) => {
              // Render user in JSX
            })
          }   
        </> 
      );
    }
  }
}                                                               

const mapReduxStateToProps = ({ users }, { location: { pathname, search } }) => {
  // Parse the query string into a hash
  const queryParams = queryString.parse(location.search);

  return { 
    // Returns list of filtered users from Redux store, or empty collection while they're being fetched
    users: getOrFetchUsers(users, queryParams), 
    queryParams,
    pathname
  };
}        

export default withRouter(connect(mapReduxStateToProps)(UsersIndexScreen));
```

##### Pagination

###### Separate pages

When you have page links, and the user views pages one at a time, and can jump to pages other than the next one.

URL

* The current page should be among the URL query parameters: E.g. `/users?page=1`

Content

* One page of content should be visible at once, with links to the subsequent pages (if applicable) - each changing the current query parameter value that keeps track of the page

Helpers

* The pagination parameters should be part of how the list is stored and retrieved (you’ll maintain separate lists in the Redux store - one for each page) so you need to get it out of the current url’s query params and pass it to `getOrFetchList(params)`

Preloader

* While fetching the initial page (and each subsequent page) display a preloader: `isFetching(list)` and then `isFinishedFetching(list)` and `isSuccess(list)`

Metadata

* Store the total number of results or pages in the list’s `metadata` (for the purpose of displaying the correct number of page links and knowing when the user is on the final page of results)

Errors

* Errors with fetching a page (server error, unauthenticated, etc): `isFinishedFetching()` and `isError()` (and possibly `getHttpStatus()`)

Example

```javascript
import React from 'react';        
import { isFetching, isFinishedFetching, isSuccess, isError, getListMetadata } from 'redux-and-the-rest';
import { connect } from 'react-redux';   
import { withRouter } from 'react-router';          
import queryString from 'query-string';
import { getOrFetchUsers } from '../../resources/users';

const UsersIndexScreen = ({ users, queryParams, pathname }) => {
  if (isFetching(users)) {
    // Return preloader
  }                    

  if (isFinishedFetching(users)) {
    if (isError(users)) {
      // Return error, using users.status.error or possiblyg using getHttpStatus(users)
    } 
  
    if (isSuccess(users)) {
      const { totalPages } = getListMetadata(users);

      return(
        <>
          {
            users.items.map(({ values }) => {
              // Render user in JSX
            })
          }    
    
          Page: 
    
          { Array(totalPages).fill().map((_, pageNumber) => {
            return(
              <Link
                to={{ pathname, search: queryString.stringify({ ...queryParams, page: pageNumber }) }} 
              > 
               {pageNumber}
              </Link>
            );          
           }) 
          }   
        </>
      );
    }
  }
}                                                               

const mapReduxStateToProps = ({ users }, { location: { pathname, search } }) => {
  // Parse the query string into a hash
  const queryParams = queryString.parse(location.search);

  return { 
    // Returns list of filtered users from Redux store, or empty collection while they're being fetched
    users: getOrFetchUsers(users, queryParams), 
    queryParams,
    pathname
  };
}        

export default withRouter(connect(mapReduxStateToProps)(UsersIndexScreen));
```

###### Infinite Scroll

When you provide an infinite scroll of content (and it’s not possible jump to another page other than the next one) 

URL

* You can chose to dynamically update the current URL as the user scrolls to change a page query parameter, or you can store the current page in some other storage mechanism, like a component’s state if you don’t want a user to be able to navigate directly to a place in the infinite scroll

Helpers

* Add your pagination parameters to the `urlOnlyParams` list to exclude them from the keys used to index a collection
* Still pass the current page to `getOrFetchList(params)` - the page number will be included in the request for the next page from the remote API, but the results returned will be appended to those of the previous pages

Preloader

* While fetching the initial page display a preloader and while fetching the next page, display the previous pages' items, with a preloader at the bottom: `isFetching(list)` and then `isFinishedFetching(list)` and `isSuccess(list)`

Metadata

* Store the total number of results or pages in the list’s `metadata` (for the purpose of knowing when the user is on the final page of results)

Errors

* Errors with fetching a page (server error, unauthenticated, etc): `isFinishedFetching()` and `isError()` (and possibly `getHttpStatus()`)

#### show

URL

* Requires an id url parameter, e.g. `/users/1` that points to the resource item being viewed

Content

* Screen named something like `UserShowScreen`
* Displays all the attributes of the item (perhaps restricted by a user’s role) and buttons for editing or deleting the resource item, where appropriate

Helpers

* Either the user has come via the index page and already has the item in the Redux store, or they are visiting the page directly it needs to be fetched. Use `getOrFetchItem()` to handle either case, with the item `id` from the URL parameter

Preloader

* While fetching the item: `isFetching(item)` and then `isFinishedFetching(item)` and `isSuccess(item)`
* May also need to fetch associated resources (e.g. current user)

Errors

* Errors with fetching the item (server error, unauthenticated, etc): `isFinishedFetching(item)` and `isError(item)` (and possibly `getHttpStatus(item)`)

Example:

```javascript
import React from 'react';        
import { isFetching, isFinishedFetching, isSuccess, isError } from 'redux-and-the-rest';
import { connect } from 'react-redux';      
import { withRouter } from 'react-router';
import { getOrFetchUser } from '../../resources/users';

const UsersShowScreen = ({ user }) => {
  if (isFetching(user)) {
    // Return preloader
  }                    

  if (isFinishedFetching(user)) {
    if (isError(user)) {
      // Return error, using user.status.error or possiblyg using getHttpStatus(user)
    } 
  
    if (isSuccess(user)) {
      // Render user in JSX 
    }
  }
}                                                               

const mapReduxStateToProps = ({ users }, { match: { id } }) => {
  return { 
    // Returns list of users from Redux store, or empty collection while they're being fetched
    user: getOrFetchUser(users, id),
  };
}        

export default withRouter(connect(mapReduxStateToProps)(UsersShowScreen));
```

#### new

URL

* Doesn't require a url parameter (the resource item hasn't been given one yes) e.g. `/users/new`

Content

* Screen named something like `NewUserScreen`
* May be a single form or UI for creating a new resource item all on one screen or a multi-step wizard (e.g. `/users/new/details` leads to `/users/new/address`)
* Depending on your application’s needs, the user is taken back to the show or index screen once the item has been created 

Helpers

* You can initialise the form with default values using `getOrInitializeItem()`
* For a single form or UI for creating a new resource item all on one screen, call `createItem()` at the end of it; for a wizard call `editNewItem()` with the new attribute values defined as each form is submitted, and then `createItem()` at the end, with all the attributes of the new item (not just those specified on the final screen)
* To fetch associated resources to pick from (to populate things like select fields): `getOrFetchList()`
* When a user cancels creating a new item, you can call `clearNewItem()` to reset back to a clean slate

Automatic routing

* To determine when the item has been created: `isFinishedCreating()` and `isSuccess()` and then redirect to the show or index page

Preloader

* While associated resources to pick from (to populate things like select fields): `isFetching(list)` and then `isFinishedFetching(list)` and `isSuccess(item)`
* May also need to fetch associated resources (e.g. current user)
* While the resource is being created on the server: `isCreating(item)` and then `isFinishedCreating(item)` and `isSuccess(item)`

Errors

* Errors with creating the item (server error, unauthenticated, invalid attribute values, etc): `isFinishedCreating(item)` and `isError(item)` (and possibly `getHttpStatus(item)`) to handle the errors appropriately - usually re-rendering the form with validation errors

#### create: Provided by remote API

The endpoint that `createItem()` is configured to make a call to by specifying a create action when defining the `resources()`.

* Returns the new item, complete with server-allocated id and all of it’s new attributes

#### edit

URL

* Require’s the resource item’s id as a URL parameter e.g. `/users/1/edit`
* May be a single form or UI for creating a new resource item all on one

Content

* Screen named something like `EditUserScreen`
* May be a single form or UI for updating an existing resource item all on one screen or a multi-step wizard (e.g. `/users/1/edit/details` leads to `/users/1/edit/address`) 
* Depending on your application’s needs, the user is taken back to the show or index screen once the item has been updated

Helpers

* You getting the current item’s attributes: `getOrFetchItem()`
* For a single form or UI for creating a new resource item all on one screen, call `updateItem()` at the end of it; for a wizard call `editItem()` with the new attribute values defined as each form is submitted and then `updateItem()` at the end, with all the attributes of the updated item
* To fetch associated resources to pick from (to populate things like select fields): `getOrFetchList()`
* When a user cancels editing an item, you can call `clearNewItem()` to reset back to the un-edited values

Automatic routing

* To determine when the item has been updated: `isFinishedUpdating()` and `isSuccess()` and then redirect to the show or index page

Preloader

* While associated resources to pick from (to populate things like select fields): `isFetching(list)` and then `isFinishedFetching(list)` and `isSuccess(item)`
* May also need to fetch associated resources (e.g. current user)
* While the resource is being updated on the server: `isUpdating(item)` and then `isFinishedUpdating(item)` and `isSuccess(item)`

Errors

* Errors with updating the item (server error, unauthenticated, invalid attribute values, etc): `isFinishedUpdating(item)` and `isError(item)` (and possibly `getHttpStatus(item)`) to handle the errors appropriately - usually re-rendering the form with validation errors

###### Sharing forms between the new and edit workflows

The edit and new pages can use the same components by using the generic versions of the redux-and-the-rest functions:

* `editNewOrExistingItem()` instead of `editNewItem()` and `editItem()`
* `saveItem()` instead of `createItem()` and `updateItem()`
* `isFinishedSaving()` instead of `isFinishedCreating()` and `isFinishedUpdating()`

Your application still has to handle the logic for deciding whether to call `getOrInitializeItem()` (usually when there is no `id` URL parameter) or `getOrFetchItem()` (usually when there is an `id` URL parameter)


Example:

```javascript
const UserForm = ({ user }) => {
  if (isSaving(user)) {
    // Return preloader
  }                    

  if (isFinishedSaving(user)) {
    if (isError(user)) {
      // Re-render form with validation errors
    } 
                
    // The container will automatically redirect away instead of rendering the component once the user
    // has been successfully created 
    return null;
  }  

  // Render form for creating or updating a user
} 

export default UserForm;
```

New user form

```javascript
import React from 'react';        
import { isSaving, getItemValues, isFinishedSaving, isSuccess, isError } from 'redux-and-the-rest';
import { connect } from 'react-redux';      
import { withRouter } from 'react-router';
import { createUser, getNewOrInitializeUser } from '../../resources/users'; 
import UserForm from './UserForm';

const mapReduxStateToProps = ({ users }, { history }) => {
  const user = getNewOrInitializeUser(users, { username: 'user' + Math.random() });

  if (isFinishedSaving(user) && isSuccess(user)) {
    // Automaticaly redirect to the user show page when it's created
    history.replace('/users/' + getItemValues(user).id);  
  } 

  return { 
    user,
    onSubmit: createUser
  };
}        

export default withRouter(connect(mapReduxStateToProps)(UserForm));
```

Edit user form

```javascript
import React from 'react';        
import { isSaving, getItemValues, isFinishedSaving, isSuccess, isError } from 'redux-and-the-rest';
import { connect } from 'react-redux';      
import { withRouter } from 'react-router';
import { updateUser, getOrFetchUser } from '../../resources/users'; 
import UserForm from './UserForm';

const mapReduxStateToProps = ({ users }, { history, match: { id } }) => {
  const user = getOrFetchUser(users, { id });

  if (isFinishedSaving(user) && isSuccess(user)) {
    // Automaticaly redirect to the user show page when it's created
    history.replace('/users/' + id);  
  } 

  return { 
    user,
    onSubmit: (newValues) => updateUser(id, { ...getItemValues(user), ...newValues})
  };
}        

export default withRouter(connect(mapReduxStateToProps)(UserForm));
```

#### update: Provided by remote API

The endpoint that `updateItem()` is configured to make a call to, by specifying a update action when defining the `resources()`.

* Returns the updated item, with all of it’s new attribute values

#### destroy: Provided by remote API

The endpoint that `destroyItem()` is configured to make a call to, by specifying a destroy action when defining the `resources()`.

* Returns a http success message if completed

### Non-RESTful actions

#### Actions that don't require a separate view

Usually these are "sub-updates" or special updates that involve some or all of an item’s attributes, with some extra domain logic or meaning on the remote API: E.g. an Archive button

URL

* Not required

Content

* A button (e.g. "Archive")

Helpers

* The helpers returned by defining a custom (e.g. `archiveItem()`) to perform a custom action - usually these re-use the same status values and reducers as either create or update

Preloader

* Because custom actions usually re-use the same status values as create or update, you can use the same `isSaving(item)` or `isSyncing(item)` and then `isFinishedSaving(item)` or `isFinishedSyncing(item)` and `isSuccess(item)`

Errors

* Errors with performing the action (server error, unauthenticated, etc): `isFinishedSaving(item)` or `isFinishedSyncing(item)` and `isError()` (and possibly `getHttpStatus()`)

#### Action that requires a separate view

These are usually summary or preview views of a subset of aggregation of data available from one or more endpoints

URL: A sub-route of the resource item they relate to

* `/users/1/preview`
* `/users/1/progress`

Content 

* Screen named something like matches URL `UsersPreviewScreen`
* Whatever display of data and client-side functionality is appropriate

Helpers

* Either the user has come via the index page and already has the item in the redux store, or they are visiting the page directly and you need to call `getOrFetchItem()` with the id from the URL parameter

Preloader

* While fetching the item: `isFetching(item)` and then `isFinishedFetching(item)` and `isSuccess(item)`
* May also need to fetch associated resources (e.g. current user)

Errors

* Errors with fetching the item (server error, unauthenticated, etc): `isFinishedFetching(item)` and `isError(item)` (and possibly `getHttpStatus(item)`)
 
## Helpers: Getters, Action Creators and Dispatchers

### Helper Types

#### Getters

These expect the current resource state as their first argument (not the entire Redux store state), and usually some extra arguments to help filter their behaviour

They are convenience methods with the appropriate context and knowledge of the internal redux-and-the-rest schema to get the correct nested data

They’re exported at the top of the resource definition returned by `resources()`.

#### Action Creators

These are your typical Redux action creators that can return either an action object or a thunk (function)

* They accept `params`, `values` and `options`, depending on the function
* They return a value that should be passed to Redux’s `dispatch()` function

They’re exported in the `actionCreators` object of the resource definition returned by resources

#### Dispatchers

These are like action creators, but they already have access to Redux’s `dispatch` function in scope and will handle calling it for you.

They have the same name and method signature as their action creator counterparts, but can be used in scopes where dispatch is not readily available

They’re exported at the top of the resource definition returned by `resources()`

### Helper arguments

Many helpers have variable arguments, with the first argument (`params`) being optional. So if you chose to provide a single argument, it will be interpreted as the `values` and the `params` value will be:

* Deduced for creating new resources from an id maintained internally
* Not used at all for singular resources

So for most helpers, variable arguments works like so:

* `helper(values)`
* `helper(params, values)`
* `helper(params, values, options)`

Exceptions are helpers that don’t accept `params` at all, like `fetchList()`:

* `helper(values)`
* `helper(values, options)`

Finally, getters - or helpers that wrap getters - require the current Redux state for the resource as the first argument, and the second argument onwards behaves as described above.

#### params

Most redux-and-the-rest methods accept `params`. These are used to index items and collections internally, and to generate the URLs to perform requests

* They can be objects, strings or integers.
* Internally, objects are stringified by normalizing their attributes and values
* Objects keys are matched against the url parameters defined for a resource or action, performing string substitution where there is a match
* String values behave as if they were wrapped in an object, with a key of id

#### values

Helpers that update the store or generate POST or PUT requests accept `values`

* For local changes, these values are merged into those already in the store
* For remote changes, all of the values to send to the remote API must be provided (depending on whether your API needs or all values to update a resource or not, you may still provide only those values that have changed)
    * This is because action creators (which perform the async requests) do not have access to the current values in the store - they must be told them as parameters
    * Of particular note is that if your user has edited a resource across multiple steps, you must make sure all values that have changed locally are submitted - not just those in the final step.

#### options

Some helpers accept a 3rd argument of options to configure their behaviour, however most configuration is usually done when defining a resource and is consistent between calls to the helper.

## Configuration Levels

| Level | Description|
| :---- | :--------- |
| Global | Applies to all resources and all actions (where applicable), but can be overridden by one of the the more specific configuration points. |
| Resource | Applies to a resource and all of its actions - uses the first argument of resources |
| Action | Applies to a single action, and is part of the action options when defining a resource |
| Action Creator |  Applies for a specific call of an action creator and is defined as the final argument of calling an action creator|


Example:

```javascript 
import { configure, resources } from 'redux-and-the-rest';

configure({
    // globalOptions
    // ...
});

const { actionCreators: { fetchList: fetchUsers } } = resources(
    {
        // resourceOptions
        name: 'users',
        url: 'http://www.example.com/users/:id',
        keyBy: 'id'
    },
    {
        fetchList: {
            // actionOptions
            // ...
        },
        fetch: {
            // actionOptions
            // ...
        }
    }
);

fetchUsers({order: 'newest'}, {
  // actionCreatorOptions
  // ...
})
```
