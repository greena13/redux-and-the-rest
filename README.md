<p align="center">
  <img src="https://cdn.rawgit.com/greena13/redux-and-the-rest/f364d1e6/images/logo.png"><br/>
  <h2 align="center">Redux and the REST</h2>
</p>

Declarative, flexible Redux integration with RESTful APIs. https://github.com/greena13/redux-and-the-rest

## Stability and Maturity

`redux-and-the-rest` is still under active development and is likely to change its functionality and API in the next few releases.

## Feature overview

* Succinct DSL inspired by the Ruby on Rails framework for defining resources and the RESTful actions to manage them
* Sensible default conventions with support for overriding them with custom behaviour
* Can be used with non-RESTful actions


## Basic usage

```javascript
import { resources } from 'redux-and-the-rest';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

/**
 * Define a users resource
 */
const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);

/**
 * Pass the reducers to your store (the reducers for only one resource is used -
 * but normally you would have many)
 */
const store = createStore(combineReducers({ users: reducers }), {}, applyMiddleware(Thunk));

/**
 * Action to fetch the users from http://test.com/users/newest and make them
 * available in your store
 */
fetchUsers('newest');

/**
 * Retrieve the users from the store
 */
users = store.getState().users.collections.newest;
```

## Install & Setup

`redux-and-the-rest` can be installed through `npm` or `yarn` as a CommonJS module:

#### npm

```
npm install redux-and-the-rest --save
```

#### yarn

```
yarn add redux-and-the-rest
```

### Dependencies

If you have already correctly installed `redux`, `redux-thunk` and (optionally) `react-redux`, then you can skip to the next section.

If you have not already done so, you must also install `redux` ([full installation instructions here](https://github.com/reduxjs/redux)):

#### npm

```
npm install redux --save
```

#### yarn

```
yarn add redux
```

If you are using React, then you will also need the React Redux bindings if you have not already installed them ([full instructions are available here](https://github.com/reduxjs/react-redux)):

#### npm

```
npm install react-redux --save
```

#### yarn

```
yarn add react-redux
```

Finally, `redux-and-the-rest` requires Redux's Thunk middleware to function:

#### npm

```
npm install redux-thunk --save
```

#### yarn

```
yarn add redux-thunk
```

You must then pass the middleware in as a parameter when you create your Redux store ([full instructions](https://github.com/reduxjs/redux-thunk#installation)):

```javascript
import { createStore, applyMiddleware, combineReducers } from 'redux';
import Thunk from 'redux-thunk';

function buildStore(initialState, reducers) {
  return createStore(combineReducers(reducers), initialState, applyMiddleware(Thunk));
}

export default buildStore;
```

# Defining resources

Resources are defined with the `resources` function, which accepts two arguments:

* `resourceOptions` - options that apply to all resources
* `actionOptions` - options that enable and configure actions (RESTful or not)

It returns an object containing redux components necessary to use the resource you have just defined:

* `reducers` - an object of reducers that you can then pass to Redux's `combineReducers` function.
* `actions` -
* action creators - these are the functions you call to trigger your stores actions and are defined if you enabled them in the `actionOptions` you passed to `resources`.

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);
```

### Setting the default configuration for resources

Values passed to `resourceOptions` are used to configure the resource and apply to all actions, unless overridden by more specific configuration:

* `name` - the pluralized name of the resource you are defining.
* `url` - a url template that defines all of the urls that will be used for the resource's actions, by default. The template string can include url parameters by prefixing them witih a colon (e.g. `:id`) and a parameter can be marked as optional by adding a question mark at the end (e.g. `:id?`). This will be used as the default url template, bu invididual actions may override it with their own.
* `keyBy` - the resources' attribute that should be used to index all items returned by the index endpoint, when they are placed in a map.

### Defining resource actions

The `actionOptions` is used to list the actions that should be defined for a particular resource and allow you to expand upon, or override, the configuration made in `resourceOptions`. `actionOptions` is map of action names to action configuration. If you want to use the default configuration for a particular action, you just need to pass a value of `true`, for example:

```javascript
{
  index: true
}
```

## Scoping and fetching resources

How the URL to fetch a particular resource is constructed, and where in the store the results of the request are placed, depend on two factors:

* How the resource's url is defined - URL parameters are substituted for values provided at the time the action is called
* What parameters are used when calling the resource's actions.

Given the following resource definition:

```javascript
import { resources } from 'redux-and-the-rest';

const { reducers, fetchUsers } = resources(
    {
        name: 'users',
        url: 'http://test.com/users/:id?'.
        keyBy: 'id'
    },
    {
        index: true
    }
);
```

### RESTful actions

* `redux-and-the-rest` makes the expected HTTP request types for each action, to the correct URL
* `fetchUsers` - #index - `GET http://test.com/users`
* `fetchUser(1)` - #show - `GET http://test.com/users/1`
* `createUser({name: 'foo'})` - #create - `POST http://test.com/users`
* `updateUser(1, {name: 'foo'})` - #update - `PUT http://test.com/users/1`
* `destroyUser(1)` - #destroy - `DELETE http://test.com/users/1`

### URL Params

* Accepts an object or a string
* If you have more than one url parameter - you need to use an object
* Serialized in a consistent manner - helper method provided
* Can be passed to any of the action creator functions and will ethier form part of the url used, or query parameters

#### Using string values

If a string value is passed to an action, it will assumed to be value of the first url parameter.

For example, calling `fetchUsers('newest')` will make a request to:

```
http://test.com/users/newest
```

and make the resulting collection of items received from that url available as:

```javascript
store.getState().users.collections['newest'];
```

#### Using object values

If an object is passed to an action, the value corresponding to the key matching the name of the URL parameter will be substituted into the URL.

Identical to the above, calling `fetchUsers({ id: 'newest' })` will make a request to:

```
http://test.com/users/newest
```

and make the resulting collection of items received from that url available as:

```javascript
store.getState().users.collections['newest'];
```

If there are other values present in the object, these are serialized and used as query parameters:

For example, calling `fetchUsers({ id: 'newest', page: 1 })` will make a request to:

```
http://test.com/users/newest?page=1
```

and make the resulting collection of items received from that url available as:

```javascript
store.getState().users.collections['id=newest.page=1'];
```

* If object used that doesn't specify matching param name, all values are used as query parameters
* Can use the `urlOnlyParams` to specify attributes in the object that should only be used in the url - useful for page numbers - subsequent calls to later pages will be placed in the same collection

### Overriding default URLs

* Can provide a `url` option when you are defining an action ad that will be used instead

```javascript
const { fetchUser } = resources(
{
    name: 'users',
    url: 'http://test.com/users/:id?',
    keyBy: 'id'
}, {
    index: true,
    show: {
      url: 'http://test.com/guests/:id?'
    },
});

// Makes request to http://test.com/guests/1
fetchUser(1);
```

## RESTful actions

### Fetching resources

#### index

* Sends a GET request to the server
* `index` action option
* returns `fetch<PluralizedResourceName>` action creator that accepts filter parameters
* Goes through a lifecycle of `FETCHING` -> `SUCCESS` or `ERROR`
* Expects the server to respond with an array of resources
* Places the results in `collections` with a key serialized from the the filter parameters

#### show

* Sends a GET request to the server
* `show` action option
* Defines a `fetch<ResourceName>` action creator that accepts filter parameters
* Goes through a lifecycle of `FETCHING` -> `SUCCESS` or `ERROR`
* Expects the server to respond with an object of the resource's attributes

### Creating a new resource

#### new

* `new` action option
* returns a `new<ResourceName>` action creator that accepts an object of parameters
* adds a new resource to the store without sending a request to the server to create it - useful if you want to create the resource over serveral steps or screens before sending it to the server to be created with `create<ResourceName>`
* Also useful if you want to create a resource with default values for the user to add to before creating
* Accepts an optional argument to specify which collection to add the new resource to, otherwise it is added to the default collection


#### clearNew

* creates a `clearNew<ResourceName>` action creator that clears a new resource that has not yet been saved to the server, from the store - useful when the user changes their mind and cancels creating a resource
* enabled using the `clearNew` action option
* does not make any requests to the server

#### create

* Sends a POST request to the server to create the resource
* `create` action option
* returns a `create<ResourceName>` action creator that accepts the new resource's attributes
* Goes through lifecycle of `CREATING` -> `SUCCESS` or `ERROR`
* Expects the server to return the new resource after it's created
* Gives the resource a temporary id (which is available as `.newItemKey` attribute in the store) until one is returned by the server, then `.newItemKey` is updated to the value assigned by the server
* Accepts a third argument that lets you specify which collection to add it to - otherwise it's added to the default blank collection

### Updating a resource

#### edit

* creates a `edit<ResourceName>` action creator that allows editing a resource locally and saving the changes in the store without sending them to the server
* Useful for moving between form pages to temporarily save progress without sending it to the server yet or displaying a confirmation page
* Lifecycle: `EDITING`


#### update

* creates a `update<ResourceName>` action creator that sends a PUT request to the server to update the resource
* Lifecycle: `UPDATING` -> `SUCCESS` or `ERROR`

### Selecting a resource

* Useful for batch actions or filtering
* ids are maintained in a `selectionMap` attribute in the store
* Makes it easy to establish whether a particular item is selected or not

#### select

* Useful when you only want to have one resource selected at once
* `select` action option
* Defines a `select<ResourceName>` action creator that accepts the id of the resource to add (as the only member) of the selection map

#### selectAnother

* Useful for when you want to select multiple resources at once
* `selectAnother` action option
* Defines a `selectAnother<ResourceName>` action creator that accepts the id of the resource to add to the selection map


#### deselect

* Allows marking a single selected resource as no longer selected

#### clearSelected

* Clears all of the selected resources from the store

### Destroying a resource

#### destroy

* returns a `destroy<ResourceName>` action creator
* Sends a DESTROY request to the server to destroy the resource
* Lifecycle of `DESTROYING` -> (removal from the store) or `DESTROY_ERROR`


