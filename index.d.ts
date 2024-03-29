import { RequestInit, RequestCredentials } from 'whatwg-fetch';
import { Action, AnyAction, Reducer, ReducersMapObject, Store } from 'redux';
import { ThunkAction } from 'redux-thunk'

/**
 * The status used when a new resource item has not yet been saved to an external API
 */
export const NEW: string;

/**
 * The status used when a resource item is being edited
 */
export const EDITING: string;

/**
 * The status used when a resource item or list is being synchronised with an external API
 */
export const FETCHING: string;

/**
 * The status used when a new resource item is being saved to an external API for the first time
 */
export const CREATING: string;

/**
 * The status used when an edited resource item is being saved to an external API
 */
export const UPDATING: string;

/**
 * The status used when a resource item is being deleted on an external API
 */
export const DESTROYING: string;

/**
 * The status used when a resource item failed to be deleted from an external API
 */
export const DESTROY_ERROR: string;

/**
 * The generic status used when a resource item is being synced with an external API
 */
export const SYNCING: string;

/**
 * The status used when a resource item or list has been successfully synchronised with an external API
 */
export const SUCCESS: string;

/**
 * The status used when a resource item or list has is being uploaded or downloaded from an external API
 */
export const PROGRESS: string;

/**
 * The status used when a resource item or list failed to synchronise with an external API
 */
export const ERROR: string;

/**
 * The metadata type used when all of the attributes of of a resource are included
 */
export const COMPLETE: string;

/**
 * The metadata type used when only the attributes necessary for a preview are included
 */
export const PREVIEW: string;

/**
 * The error type when a client error has occurred when making a request. This can be a local JavaScript
 * exception, or it can be a network timeout or disconnect.
 */
export const CLIENT_ERROR: string;

/**
 * The key to use for items and lists when a one hasn't otherwise been specified or applies
 */
export const UNSPECIFIED_KEY: string;

/**
 * One of the statuses a resource item or resource list can be in
 */
export type StatusType = string;

interface ErrorStatusRequired {
    /**
     * The type of the error as either CLIENT_ERROR or specified in the response body or error handler
     */
    type: string;

    /**
     * The raw Error class when a client-side error occurs
     */
    raw?: Error
}

/**
 * Information about a request error
 */
export interface ErrorStatus extends ErrorStatusRequired {
    [extraValues: string]: any
}

export interface ResourceStatusRequired {
    /**
     * The type of status of the resource item or list
     */
    type: StatusType | null;
}

/**
 * An object containing the status information of a particular resource item or resource list.
 */
export interface ResourceStatus extends ResourceStatusRequired {
    /**
     * The HTTP status code when an error occurs
     */
    httpCode?: number;

    /**
     * Details of the errors, if status type is ERROR
     */
    errors?: Array<ErrorStatus>;

    /**
     * The first error in errors, if status type is ERROR
     */
    error?: ErrorStatus;

    /**
     * When the error occurred
     */
    errorOccurredAt?: number;

    /**
     * When a request to fetch, create or update the resource item or list was last made to an external
     * API
     */
    requestedAt?: number;

    /**
     * When a response to fetch, create or update the resource item or list was last received from an
     * external API
     */
    syncedAt?: number;
}

export interface ResourceItemStatus<T> extends ResourceStatus {
    /**
     * Whether the resource item has been edited since it was last retrieved from an external API
     */
    dirty?: boolean;

    /**
     * The original values before any local edits were done
     */
    originalValues?: T
}

/**
 * Information about the type of metadata the resource item or list represents
 */
export interface Metadata {
    [extraValues: string]: any
}

/**
 * The generic structure items and lists
 */
export interface GenericItemOrList {
    /**
     * The status information of the item or list
     */
    status: ResourceStatus;

    /**
     * The metadata information of the item or list
     */
    metadata: Metadata
}

/**
 * The state and values of a single item of a particular resource
 */
export interface ResourcesItem<T> extends GenericItemOrList {
    values: T;

    /**
     * The status information of the resource
     */
    status: ResourceItemStatus<T>;
}

/**
 * The parameters used to serialize a key to reference an item or list by
 */
export type ItemOrListParameters = object | string | number;

/**
 * The unique identifier of a resource list
 */
export type ResourceListId = string;

/**
 * A list of a particular resource
 */
export interface ResourcesList<T> extends GenericItemOrList {
    /**
     * A list of ids of resources in the order they appear in that list.
     */
    positions: string[];

    /**
     * The list of items in the list, in the order that they appear
     */
    items: Array<ResourcesItem<T>>
}

export interface ResourcesReduxState<T> {
    /**
     * The set of items of a particular resource type
     */
    items: { [key: string]: ResourcesItem<T>; };

    /**
     * The set of lists of a particular resource type
     */
    lists: { [key: string]: ResourcesList<T>; };

    /**
     * A dictionary of the resources that are currently selected.
     */
    selectionMap: { [key: string]: boolean; };

    /**
     * The temporary key that is being used for a new resource item until it's been saved to a remote API and
     * given a permanent unique identifier.
     */
    newItemKey: string | null;
}

/**
 * Object for building and then returning an initial resource list state that can be passed to a Redux store
 * and work with the reducers returned by the resources() function
 */
export interface InitialListStateBuilder<T> {
    /**
     * Adds a new item to the list's initial state builder
     * @param valuesOrParams Either the values of a new item to add to the initial state, outside of any
     *        list, or the params of the item to use to index it.
     * @param optionalValues The values of the item, if the first argument was used to specify params
     * @returns a new initial state builder scoped to the new item
     */
    addItem: (valuesOrParams: object | T, optionalValues?: T) => InitialItemStateBuilder<T>;

    /**
     * Generates the initial list state the builder has been configured for, in the format suitable to
     * pass to the Redux store.
     * @param ResourceStatus The status to use for the list and all of its items if the list hasn't
     *        set its own.
     * @param ResourceMetadata The metadata to use for the list and all of its items if the
     *        list hasn't set its own.
     */
    build: ({status: ResourceStatus, metadata: Metadata}) => ResourcesList<T>;

    /**
     * Generates a map of items indexed by their correct key
     * @param ResourceStatus The status to use for the items if the list or item hasn't set its own.
     * @param ResourceMetadata The metadata for the items if the list or item hasn't set its own.
     */
    buildItems: ({status: ResourceStatus, metadata: Metadata}) => { [key: string]: ResourcesItem<T>; }

    /**
     * Sets the status of the initial state
     * @param ResourceStatusRequired The status type to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setStatusType: (ResourceStatusRequired) => InitialListStateBuilder<T>;

    /**
     * Sets the date the data was synced at
     * @param date The date the data was last synced
     * @returns itself to allow for chaining method calls
     */
    setSyncedAt: (date) => InitialListStateBuilder<T>;

    /**
     * Sets the metadata of the initial state
     * @param ResourceStatusRequired The metadata object to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setMetadata: (Metadata) => InitialListStateBuilder<T>;
}

/**
 * Object for building and then returning an initial resource item state that can be passed to a Redux store
 * and work with the reducers returned by the resources() function
 */
export interface InitialItemStateBuilder<T> {
    /**
     * Generates the initial item state the builder has been configured for, in the format suitable to pass to
     * the Redux store.
     * @param ResourceStatus The status to use for the item if it hasn't set its own.
     * @param ResourceMetadata The metadata for the item if it hasn't set its own.
     */
    build: ({status: ResourceStatus, metadata: Metadata}) => ResourcesItem<T>;

    /**
     * Sets the status of the initial state
     * @param ResourceStatusRequired The status type to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setStatusType: (ResourceStatusRequired) => InitialItemStateBuilder<T>;

    /**
     * Sets the date the data was synced at
     * @param date The date the data was last synced
     * @returns itself to allow for chaining method calls
     */
    setSyncedAt: (date) => InitialItemStateBuilder<T>;

    /**
     * Sets the metadata of the initial state
     * @param ResourceStatusRequired The metadata object to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setMetadata: (MetadataRequired) => InitialItemStateBuilder<T>;
}

/**
 * Object for building and then returning an initial state that can be passed to a Redux store and work
 * with the reducers returned by the resources() function
 */
export interface InitialResourceStateBuilder<T> {
    /**
     * Adds a new list to the initial state builder
     * @param itemsOrParams Either the params to use to index the list or the list of items that
     *        make up the list. If no params are specified, the default unscoped list is used.
     * @param optionalItems The list of items in the list, if they were not specified as the first
     *        argument
     * @returns a new initial state builder scoped to the new list
     */
    addList: (itemsOrParams: object | Array<T>, optionalItems?: Array<T>) => InitialListStateBuilder<T>;

    /**
     * Adds a new item to the initial state builder
     * @param paramsOrValues Either the values of a new item to add to the initial state, outside of any
     *        list, or the params of the item to use to index it.
     * @param optionalValues The values of the item, if the first argument was used to specify params
     * @returns a new initial state builder scoped to the new item
     */
    addItem: (paramsOrValues: object | T, optionalValues?: T) => InitialItemStateBuilder<T>;

    /**
     * Generates the initial state the builder has been configured for, in the format suitable to pass to
     * the Redux store.
     */
    build: () => ResourcesReduxState<T>;

    /**
     * Sets the status of the initial state
     * @param ResourceStatusRequired The status type to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setStatusType: (ResourceStatusRequired) => InitialResourceStateBuilder<T>;

    /**
     * Sets the date the data was synced at
     * @param date The date the data was last synced
     * @returns itself to allow for chaining method calls
     */
    setSyncedAt: (date) => InitialResourceStateBuilder<T>;

    /**
     * Sets the metadata of the initial state
     * @param ResourceStatusRequired The metadata object to set as the initial state
     * @returns itself to allow for chaining method calls
     */
    setMetadata: (MetadataRequired) => InitialResourceStateBuilder<T>;
}

/**
 * Returns an item of a particular resource item from a Redux store, removing any structure used implicitly.
 */
export interface GetItemFunction<T> { (currentState: ResourcesReduxState<T>, params: ItemOrListParameters): ResourcesItem<T> }

export interface GetSingularResourceItemFunction<T> { (currentState: ResourcesReduxState<T>): ResourcesItem<T> }

/**
 * Returns an item of a particular resource from a Redux store. If the item is not available in the store,
 * an empty item is returned immediately and the fetch action creator is called to update the store and
 * request the resource item from an external API.
 * @param currentState The current resource Redux store state
 * @param params The params to serialize to use as the key to find the resource list.
 * @param actionCreatorOptions The options to pass to the fetch action creator if it's called.
 * @returns The resource item if it's in the store, or an empty item.
 */
export interface GetOrFetchItemFunction<T> { (currentState: ResourcesReduxState<T>, params: ItemOrListParameters, actionCreatorOptions?: RemoteActionCreatorOptions<T>): ResourcesItem<T> }

/**
 * Returns an item of a particular resource from a Redux store. If the item is not available in the store,
 * an empty item is returned immediately and the fetch action creator is called to update the store and
 * request the resource item from an external API.
 * @param currentState The current resource Redux store state
 * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either a string or object that is serialized
 *        and used to fill in the dynamic parameters of the resource's URL (params) or the attribute values
 *        to initialize the item with if it is not already in the store.
 * @param {Object | ActionCreatorOptions} valuesOrActionCreatorOptions Either be the values used for initialization, or additional
 *        options passed to the action creator when it is called.
 * @param {ActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
 */
export interface GetOrInitializeItemFunction<T> { (currentState: ResourcesReduxState<T>, paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | ActionCreatorOptions<T>, optionalActionCreatorOptions?: ActionCreatorOptions<T>): ResourcesItem<T> }

export interface GetOrFetchSingularResourceItemFunction<T> { (currentState: ResourcesReduxState<T>, params?: ItemOrListParameters, actionCreatorOptions?: RemoteActionCreatorOptions<T>): ResourcesItem<T> }

/**
 * Returns a list of a particular resource from a Redux store, populating it with the correct items, in
 * the right order.
 */
export interface GetListFunction<T> { (currentState: ResourcesReduxState<T>, params?: ItemOrListParameters): ResourcesList<T> }

/**
 * Returns an list of a particular resource from a Redux store. If the list is not available in the store,
 * an empty list is returned immediately and the fetch action creator is called to update the store and
 * request the resource list from an external API.
 * @param currentState The current resource Redux store state
 * @param params The params to serialize to use as the key to find the resource list.
 * @param actionCreatorOptions The options to pass to the fetch action creator if it's called.
 * @returns The resource list if it's in the store, or an empty list.
 */
export interface GetOrFetchListFunction<T> { (currentState: ResourcesReduxState<T>, params?: ItemOrListParameters, actionCreatorOptions?: FetchListActionCreatorOptions<T>): ResourcesList<T> }

/**
 * The type of Redux action that is emitted when that action occurs
 */
export type ActionType = string;

export interface StandardActionDictionary {
    fetchList?: string;
    fetchItem?: string;
    newItem?: string;
    clearNewItem?: string;
    editNewItem?: string;
    createItem?: string;
    editItem?: string;
    editNewOrExistingItem?: string;
    clearItemEdit?: string;
    updateItem?: string;
    destroyItem?: string;
    clearResource?: string;
    clearItem?: string;
    clearList?: string;
    selectItem?: string;
    selectAnotherItem?: string;
    deselectItem?: string;
    clearSelectedItems?: string;
}

/**
 * Mapping between action names and their types
 */
export interface ActionDictionary extends StandardActionDictionary {
    [key: string]: ActionType;
}

/**
 * Function that dispatches an AnyAction or an ThunkAction
 */
export interface ActionCreatorFunction { (...args: any[]): ThunkAction<void, any, any, AnyAction> }

/**
 * A dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
 */
export interface StandardResourcesActionCreatorDictionary<T> {
    /**
     * Redux action creator used for fetching a list or resources from an index RESTful API endpoint
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in the dynamic parameters
     *        of the resource's URL
     * @param {FetchListActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    fetchList: (params?: ItemOrListParameters, actionCreatorOptions?: FetchListActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for fetching a single resource item from a fetch RESTful API endpoint
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in the dynamic parameters
     *        of the resource's URL
     * @param {RemoteActionCreatorOptionsWithMetadata} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    fetchItem: (params?: ItemOrListParameters, actionCreatorOptions?: RemoteActionCreatorOptionsWithMetadata<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for adding a new resource item to the Redux store WITHOUT sending it to a remote API
     * (yet). This action is used for storing a new resource item locally before actually creating it
     * (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either a string or object that is serialized
     *        and used to fill in the dynamic parameters of the resource's URL (params) or the new attribute values
     *        to merge into the exist ones of the new resource item, or to use to create the resource item for the
     *        first time.
     * @param {Object | ActionCreatorOptions} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
     *        options passed to the action creator when it is called.
     * @param {ActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    newItem: (paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | ActionCreatorOptions<T>, optionalActionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for clearing the new resource.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearNewItem: () => AnyAction;

    /**
     * Redux action creator used for editing the attributes of a new resource item (one that hasn't been saved to
     * a remote API yet). This action is used for editing a resource item locally (perhaps across
     * multiple stages or screens) before actually saving it (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either be a string or object
     *        that is serialized and used to fill in the dynamic parameters of the resource's URL (params) or the new
     *        attribute values to merge into the exist ones of the new resource
     * @param {Object|ActionCreatorOptions} valuesOrActionCreatorOptions Either the new attribute values to merge into the exist ones
     *        of the new resource item, or addition options passed to the action creator when it is called.
     * @param {ActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    editNewItem: (paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | ActionCreatorOptions<T>, optionalActionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for sending a CREATE request to a RESTful API endpoint
     * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either a string
     *        or object that is serialized and used to fill in the dynamic parameters of the resource's URL
     *        (params) or the attribute values to use to create the resource.
     * @param {Object|CreateItemActionCreatorOptions} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
     *        options passed to the action creator when it is called.
     * @param {CreateItemActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    createItem: (paramsOrValues: ItemOrListParameters | T , valuesOrActionCreatorOptions?: T | CreateItemActionCreatorOptions<T>, optionalActionCreatorOptions?: CreateItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for updating the attributes of a resource item WITHOUT sending those updated
     * attributes to a remote API (yet). This action is used for editing a resource item locally (perhaps across
     * multiple stages or screens) before actually updating it (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in
     *        the dynamic parameters of the resource's URL
     * @param {Object} values The new attribute values to merge into the exist ones of the resource item.
     * @param {ActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    editItem: (params: ItemOrListParameters, values: T, actionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for updating the attributes of a new or existing resource item WITHOUT sending those updated
     * attributes to a remote API (yet). This action is used for editing a resource item locally (perhaps across
     * multiple stages or screens) before actually updating it (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in
     *        the dynamic parameters of the resource's URL
     * @param {Object} values The new attribute values to merge into the exist ones of the resource item.
     * @param {ActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    editNewOrExistingItem: (params: ItemOrListParameters, values: T, actionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for clearing the new resource.
     * @param {ItemOrListParameters} params A string or object that is serialized and used to generate
     *        the index of the resource item
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearItemEdit: (params: ItemOrListParameters) => AnyAction;

    /**
     * Redux action creator used for sending an UPDATE request to a RESTful API endpoint
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill
     *        in the dynamic parameters of the resource's URL
     * @param {Object} values The attribute values to use to update the resource
     * @param {UpdateItemActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    updateItem: (params: ItemOrListParameters, values: T, actionCreatorOptions?: UpdateItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for destroying a resource item by making a DELETE request to a RESTful API endpoint
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in
     *        the dynamic parameters of the resource's URL
     * @param {DestroyItemActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action
     *        creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    destroyItem: (params: ItemOrListParameters, actionCreatorOptions?: DestroyItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for clearing an item from the store
     * @param {ItemOrListParameters} params A string or object that is serialized and used to find
     *        the item to clear.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearItem: (params: ItemOrListParameters) => AnyAction;

    /**
     * Redux action creator used for clearing a list from the store
     * @param {ItemOrListParameters} params A string or object that is serialized and used to find
     *        the item to clear
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearList: (params: ItemOrListParameters) => AnyAction;

    /**
     * Redux action creator used for resetting a resource back to empty
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearResource: () => AnyAction;

    /**
     * Redux action creator used for selecting a resource item and replacing any already selected items
     * @param {ItemOrListParameters|ItemOrListParameters[]} params A string or object that is serialized and used to fill in
     *        the dynamic parameters of the resource's URL
     * @param {SelectItemOptions} [actionCreatorOptions={}] The options passed to the action creator when
     *         it is called.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    selectItem: (params: ItemOrListParameters, actionCreatorOptions?: SelectItemOptions) => AnyAction;

    /**
     * Redux action creator used for selecting a resource item and adding it to those already selected
     * @param {ItemOrListParameters|ItemOrListParameters[]} params A string or object that is serialized and used to fill in the dynamic parameters
     *        of the resource's URL
     * @param {SelectItemOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    selectAnotherItem: (params: ItemOrListParameters, actionCreatorOptions?: SelectItemOptions) => AnyAction;

    /**
     * Redux action creator used for deselecting a selected resource item
     * @param {ItemOrListParameters|ItemOrListParameters[]} params A string or object that is serialized and used to fill in the dynamic parameters
     *        of the resource's URL
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    deselectItem: (params: ItemOrListParameters) => AnyAction;

    /**
     * Redux action creator used for clearing all of the selected resource items
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearSelectedItems: () => AnyAction;
}

export interface ResourcesActionCreatorDictionary<T> extends StandardResourcesActionCreatorDictionary<T> {
    [key: string]: any;
}

export interface StandardSingularResourceActionCreatorDictionary<T> {
    /**
     * Redux action creator used for fetching a single resource item from a fetch RESTful API endpoint
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in the dynamic parameters
     *        of the resource's URL
     * @param {RemoteActionCreatorOptionsWithMetadata} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    fetchItem: (params?: ItemOrListParameters, actionCreatorOptions?: RemoteActionCreatorOptionsWithMetadata<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for adding a new resource item to the Redux store WITHOUT sending it to a remote API
     * (yet). This action is used for storing a new resource item locally before actually creating it
     * (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either a string or object that is serialized
     *        and used to fill in the dynamic parameters of the resource's URL (params) or the new attribute values
     *        to merge into the exist ones of the new resource item, or to use to create the resource item for the
     *        first time.
     * @param {Object| ActionCreatorOptions} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
     *        options passed to the action creator when it is called.
     * @param {Object} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    newItem: (paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | ActionCreatorOptions<T>, optionalActionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for clearing the new resource.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearNewItem: () => AnyAction;

    /**
     * Redux action creator used for editing the attributes of a new resource item (one that hasn't been saved to
     * a remote API yet). This action is used for editing a resource item locally (perhaps across
     * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either be a string or object
     *        that is serialized and used to fill in the dynamic parameters of the resource's URL (params) or the new
     *        attribute values to merge into the exist ones of the new resource* multiple stages or screens) before actually saving it (which sends the new attributes to the remote API).
     * @param {Object} valuesOrActionCreatorOptions The new attribute values to merge into the exist ones of the resource item.
     * @param {ActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    editNewItem: (paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | ActionCreatorOptions<T>, optionalActionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for sending a CREATE request to a RESTful API endpoint
     * @param {ItemOrListParameters | Object} paramsOrValues The first argument which can either a string
     *        or object that is serialized and used to fill in the dynamic parameters of the resource's URL
     *        (params) or the attribute values to use to create the resource.
     * @param {Object|CreateItemActionCreatorOptions} valuesOrActionCreatorOptions Either be the values used by the action creator, or addition
     *        options passed to the action creator when it is called.
     * @param {CreateItemActionCreatorOptions} [optionalActionCreatorOptions=undefined] The optional additional options passed to the action controller.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    createItem: (paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | CreateItemActionCreatorOptions<T>, optionalActionCreatorOptions?: CreateItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for updating the attributes of a resource item WITHOUT sending those updated
     * attributes to a remote API (yet). This action is used for editing a resource item locally (perhaps across
     * multiple stages or screens) before actually updating it (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters} params A string or object that is serialized and used to fill in
     *        the dynamic parameters of the resource's URL
     * @param {Object} valuesOrActionCreatorOptions The new attribute values to merge into the exist ones of the resource item.
     * @param {ActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    editItem: (paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T, optionalActionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for updating the attributes of a new or existing resource item WITHOUT sending those updated
     * attributes to a remote API (yet). This action is used for editing a resource item locally (perhaps across
     * multiple stages or screens) before actually updating it (which sends the new attributes to the remote API).
     * @param {ItemOrListParameters} paramsOrValues Either a string or object that is serialized and used to fill
     *        in the dynamic parameters of the resource's URL, or the new attribute values.
     * @param {Object} values The new attribute values to merge into the exist ones of the resource item.
     * @param {ActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    editNewOrExistingItem: (paramsOrValues: ItemOrListParameters, valuesOrActionCreatorOptions?: T, optionalActionCreatorOptions?: ActionCreatorOptions<T>) => AnyAction;

    /**
     * Redux action creator used for clearing the new resource.
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearItemEdit: () => AnyAction;

    /**
     * Redux action creator used for sending an UPDATE request to a RESTful API endpoint
     * @param {ItemOrListParameters} paramsOrValues Either a string or object that is serialized and used to
     *        fill in the dynamic parameters of the resource's URL, or new attribute values
     * @param {Object} valuesOrActionCreatorOptions The attribute values to use to update the resource
     * @param {UpdateItemActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    updateItem: (paramsOrValues: ItemOrListParameters, valuesOrActionCreatorOptions?: T, actionCreatorOptions?: UpdateItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for destroying a resource item by making a DELETE request to a RESTful API endpoint
     * @param {ItemOrListParameters} paramsOrActionCreatorOptions A string or object that is serialized and used to fill in
     *        the dynamic parameters of the resource's URL
     * @param {DestroyItemActionCreatorOptions} [actionCreatorOptions={}] The options passed to the action
     *        creator when it is called.
     * @returns {ThunkAction} Function to call to dispatch an action
     */
    destroyItem: (paramsOrActionCreatorOptions?: ItemOrListParameters | DestroyItemActionCreatorOptions<T>, actionCreatorOptions?: DestroyItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;

    /**
     * Redux action creator used for clearing an item from the store
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearItem: () => AnyAction;

    /**
     * Redux action creator used for resetting a resource back to empty
     * @returns {AnyAction} Action Object that will be passed to the reducers to update the Redux state
     */
    clearResource: () => AnyAction;
}

export interface SingularResourceActionCreatorDictionary<T> extends StandardSingularResourceActionCreatorDictionary<T> {
    [key: string]: any;
}

interface ActionAndActionCreatorSharedOptions<T> {
    /**
     * The request configuration object to be passed to the fetch method, or the new XMLHttpRequest object,
     * when the progress option is used.
     */
    request?: Object;
}

export interface SelectItemOptions {
    /**
     *  The value to store with the selection. By default it's the value, true, but can be any contextually
     *  significant value.
     */
    value?: any
}

export interface ActionCreatorOptions<T> extends ActionAndActionCreatorSharedOptions<T>{

}

export interface RemoteActionCreatorOptions<T> extends ActionCreatorOptions<T> {
    /**
     * Whether to ignore any outstanding requests with the same URL and make the request again, anyway
     */
   forceFetch?: boolean | ((list: ResourcesList<T>) => boolean) | ((item: ResourcesItem<T>) => boolean) ;
}

export interface RemoteActionCreatorOptionsWithMetadata<T> extends RemoteActionCreatorOptions<T> {
    /**
     * An object of attributes and values that describe the list's metadata. It can be used for
     * containing information like page numbers, limits, offsets and includes for lists and types
     * for items (previews, or the complete set of attributes of an item).
     */
    metadata?: Object;
}

export interface FetchListActionCreatorOptions<T> extends RemoteActionCreatorOptionsWithMetadata<T> {
    /**
     * Defines the metadata of each item in the list (the metadata is applied to the list).
     */
    itemsMetadata?: Object
}

export interface UpdateItemActionCreatorOptions<T> extends RemoteActionCreatorOptionsWithMetadata<T> {
    /**
     * The values of the resource item being updated, to allow more efficiently updating associated
     * items.
     */
    previousValues?: T;
}

/**
 * Function responsible for merging a new item into a list of existing ones by returning the list new item
 * keys in the correct order
 */
export interface ListPositionsMerger<T> { (existingItems: Array<ResourcesItem<T>>, newItem: ResourcesItem<T>): string[] }

/**
 * Function responsible for sorting list of existing items by returning the list's item keys in the correct
 * order
 */
export interface ListPositionsSorter<T> { (existingItems: Array<ResourcesItem<T>>): string[] }

export type MergerAndListParameterTuple<T> =  [Array<ItemOrListParameters>, ListPositionsMerger<T>];

export type SorterAndListParameterTuple<T> =  [Array<ItemOrListParameters>, ListPositionsSorter<T>];

export interface ListOperations<T> {
    /**
     * A An array of list keys to push the new item to the end of.
     */
    push?: Array<ItemOrListParameters>;

    /**
     * A An array of list keys to add the new item to the beginning of.
     */
    unshift?: Array<ItemOrListParameters>;

    /**
     * An array of list keys for which to clear (invalidate). This is useful for when you know the item
     * that was just created is likely to appear in a list, but you don't know where, so you need to
     * re-retrieve the whole list from the server.
     */
    invalidate?: Array<ItemOrListParameters>;

    /**
     * An array of tuples where the first element is an array of list keys and the second is a merger
     * function that accepts an array of items in their current order, and the new item, as arguments.
     */
    merge?: Array<MergerAndListParameterTuple<T>>;

    /**
     * An array of tuples where the first element is an array of list keys and the second is a sorter
     * function that accepts an array of items in their current order.
     */
    sort?: Array<SorterAndListParameterTuple<T>>;
}

export interface CreateItemActionCreatorOptions<T> extends RemoteActionCreatorOptionsWithMetadata<T>, ListOperations<T> {
}

export interface DestroyItemActionCreatorOptions<T> extends RemoteActionCreatorOptions<T> {
    /**
     * The values of the resource item being destroyed, to allow more efficiently updating associated
     * items.
     */
    previousValues?: T;
}

interface ResourceDefinitionCommon<T> {
    /**
     * Mapping between RESTful action names and constant Redux Action names
     */
    actions: ActionDictionary;

    /**
     *  Reducer function that will accept the resource's current state and an action and return the new
     *  resource state
     */
    reducers: Reducer;

    /**
     * Function that returns the new item of a resource type
     */
    getNewItem: GetSingularResourceItemFunction<T>;

    /**
     * Function that returns a particular item of a resource type or initializes it to the specified values
     */
    getOrInitializeNewItem: GetOrInitializeItemFunction<T>;

    /**
     * Creates a new item if it does not exist in the store, or has a status of NEW, otherwise updates it
     @param currentState The current resource Redux store state
     * @param paramsOrValues The second argument which can either be a string
     *        or object that is serialized and used to fill in the dynamic parameters of the resource's URL
     *        (params), or the attribute values to use to create or update the resource.
     * @param valuesOrActionCreatorOptions Either be the values used
     *        by the action creator, or additional options passed to the action creator when it is called.
     * @param optionalActionCreatorOptions The additional options passed to the action controller.
     * @returns {ThunkAction} Function to call to save or update the resource item
     */
    saveItem: (currentState: ResourcesReduxState<T>, paramsOrValues: ItemOrListParameters | T, valuesOrActionCreatorOptions?: T | CreateItemActionCreatorOptions<T>, optionalActionCreatorOptions?: CreateItemActionCreatorOptions<T>) => ThunkAction<void, any, any, AnyAction>;
}

export interface ResourcesDefinition<T> extends ResourceDefinitionCommon<T>, ResourcesActionCreatorDictionary<T>{
    /**
     * Dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
     */
    actionCreators: ResourcesActionCreatorDictionary<T>;

    /**
     * Function that returns a particular item of a resource type or calls the fetch action creator if it's
     * not available in the store
     */
    getOrFetchItem: GetOrFetchItemFunction<T>;

    /**
     * Function that returns a particular list of a resource type or calls the fetch action creator if it's
     * not available in the store
     */
    getOrFetchList: GetOrFetchListFunction<T>;

    /**
     * Function that returns a particular list of resources
     */
    getList: GetListFunction<T>;

    /**
     * Function that returns a particular item of a resource type
     */
    getItem: GetItemFunction<T>;

    /**
     * First attempts to retrieve an exiting item using the provided params and then falls back to trying to
     * get the new item
     */
    getNewOrExistingItem: GetItemFunction<T>;

    /**
     * Function to build the initial resource state
     */
    buildInitialState: (items: Array<T>) => InitialResourceStateBuilder<T>;
}

export interface SingularResourceDefinition<T> extends ResourceDefinitionCommon<T>, SingularResourceActionCreatorDictionary<T>{
    /**
     * Dictionary of ActionCreatorFunctions indexed by their ActionCreatorName
     */
    actionCreators: SingularResourceActionCreatorDictionary<T>;

    /**
     * Function that returns a particular item of a resource type or calls the fetch action creator if it's
     * not available in the store
     */
    getOrFetchItem: GetOrFetchSingularResourceItemFunction<T>;

    /**
     * Function that returns a particular item of a resource type
     */
    getItem: GetSingularResourceItemFunction<T>;

    /**
     * Function to build the initial resource state
     */
    buildInitialState: (items: T) => InitialResourceStateBuilder<T>;
}

/**
 * A Mapping between the name of an associated resource, and its definition.
 */
export type AssociationOptions<T> = {
    /**
     * Name of the attribute that stores the id or ids of the current resource on the associated one. If
     * unspecified, the `as` attribute (or the resource's `name` value) are appended with the suffix of `id`.
     */
    foreignKey?: string;

    /**
     *  If a foreign key is not specified, this association name is used with a suffix of `id` to derive
     *  the foreign key
     */
    as?: string;

    /**
     * key The key to use as the foreign key on this resource, to refer to the associated resource. If not
     * specified, the associationName with a suffix of `id` for `belongsTo` associations and `ids` for
     * `belongsToAndHasMany` associations is used.
     */
    key?: string;

    /**
     * Whether to remove the associated resource if the current one is removed from the store.
     */
    dependent?: boolean;
}

/**
 * Function that accepts the raw request response and returns the values that should be passed to the reducers
 * and saved in the Redux store
 */
export type ResponseAdaptorFunction = (responseBody: Object, response: Response) => {
    /**
     * The values of the list or item, extracted from the response body
     */
    values: Object;

    /**
     * The error details extracted from the response body (if a singular error)
     * @deprecated
     */
    error?: Object | string;

    /**
     * The errors' details extracted from the response body
     */
    errors?: Array<Object | string>;

    /**
     * Additional metadata that should be stored with the list or item, but does not form part of its attributes
     */
    metadata?: Object
};

/**
 * Function that accepts an item's values and returns a JSON-serializable object to be used as a request body
 */
export type RequestAdaptorFunction = (requestBody: Object) => Object;

export interface GlobalConfigurationOptions {
    /**
     * The resource attribute used to key/index all items of the current resource type. This will be the value
     * you pass to each action creator to identify the target of each action. By default, 'id' is used.
     */
    keyBy?: string | Array<string>;

    /**
     * Set to true for resources that should be edited locally, only. The fetch and fetchList actions are disabled
     * (the fetch* action creators are not exported) and the createItem, updateItem and destroyItem only update the store
     * locally, without making any HTTP requests.
     */
    localOnly?: boolean;

    /**
     * The attributes passed to action creators that should be used to create the request URL, but ignored
     * when storing the request's response.
     */
    urlOnlyParams?: Array<string>;

    /**
     * Function used to adapt the responses for requests before it is handed over to the reducers. The function
     * must return the results as an object with properties values and (optionally) error.
     */
    responseAdaptor?: ResponseAdaptorFunction;

    /**
     * Function used to adapt the JavaScript object before it is handed over to become the body of the request
     * to be sent to an external API.
     */
    requestAdaptor?: RequestAdaptorFunction;

    /**
     * Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the
     * request only if it's on the same origin.
     */
    credentials?: RequestCredentials;

    /**
     * The Accept header to use with each request. Defaults to the contentType if not defined.
     */
    acceptType?: String;

    /**
     * The Content-Type header to use with each request
     */
    contentType?: String;

    /**
     * The Content-Type of error responses that should be parsed as JSON. Defaults to the contentType if not defined.
     */
    errorContentType?: String;

    /**
     * Set of options passed to query-string when serializing query strings
     * @see https://www.npmjs.com/package/query-string
     */
    queryStringOptions?: Object;

    /**
     * The request configuration object to be passed to the fetch method, or the new XMLHttpRequest object,
     * when the progress option is used.
     */
    request?: RequestInit;

    /**
     * The key to use use as a wildcard to mean all lists
     */
    listWildcard?: String;

    /**
     * Function to generate ids for new resource items
     * @returns A new resource id
     */
    generateId?: () => String;

    /**
     * A list of functions to call before passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional pre-processing to standardise the resource before
     * it is added to the store.
     */
    beforeReducers?: Array<CustomReducerFunction<unknown>> | CustomReducerFunction<unknown>;

    /**
     * A custom reducer function to use for the action. Either a Reducer function (accepting the current
     * resource state and the next action as arguments), or the name of one of an action (e.g. 'fetchItem',
     * 'createItem') if you want to re-use one of the standard reducers.
     *
     * By default, the standard RESTful reducer is used for RESTful actions, but this attribute is
     * required for Non-RESTful actions.
     */
    reducer?: keyof StandardActionDictionary | CustomReducerFunction<unknown>;

    /**
     * A list of functions to call after passing the resource to the reducer. This is useful if you want to use
     * the default reducer, but provide some additional post-processing to standardise the resource before it
     * is added to the store.
     */
    afterReducers?: Array<CustomReducerFunction<unknown>> | CustomReducerFunction<unknown>;

    /**
     * The Redux store, used to directly invoke dispatch and get state for the getOrFetchItem() and
     * getOrFetchList() functions
     */
    store?: Store;
}

export interface CustomReducerHelpers<T> {
    /**
     * Returns the status of an item by providing its params
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @returns The item's status object
     */
    getItemStatus: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourceStatus;

    /**
     * Returns a copy of current resource's redux state with an item's status merged with new values
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @param newStatus An object of values to merge into the item's current status object
     * @returns The resource's redux state with the item's new status values
     */
    mergeItemStatus: (state: ResourcesReduxState<T>, params: ItemOrListParameters, newStatus: {}) => ResourcesReduxState<T>;

    /**
     * Returns the values of an item by providing its params
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @returns The item's values object
     */
    getItemValues: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item's values merged with new values
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @param newValues An object of values to merge into the item's current values object
     * @returns The resource's redux state with the item's new values
     */
    mergeItemValues: (state: ResourcesReduxState<T>, params: ItemOrListParameters, newValues: {}) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item's values replaced by new values
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @param values An object of values to replace the item's current values object
     * @returns The resource's redux state with the item's new values
     */
    replaceItemValues: (state: ResourcesReduxState<T>, params: ItemOrListParameters, values: {}) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item's values cleared
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @returns The resource's redux state with the item's new values
     */
    clearItemValues: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item omitted
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @returns The resource's redux state with the item's new values
     */
    clearItem: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;

    /**
     * Returns the metadata of an item by providing its params
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @returns The item's metadata object
     */
    getItemMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => Metadata;

    /**
     * Returns a copy of current resource's redux state with an item's metadata merged with new values
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @param newStatus An object of values to merge into the item's current metadata object
     * @returns The resource's redux state with the item's new metadata values
     */
    mergeItemMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters, metadata: {}) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item's metadata replaced by new metadata
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @param metadata An object of metadata to replace the item's current metadata object
     * @returns The resource's redux state with the item's new metadata
     */
    replaceItemMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters, metadata: {}) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item's metadata cleared
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the item's key
     * @returns The resource's redux state with the item's new metadata
     */
    clearItemMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;

    /**
     * Returns the status of an list by providing its params
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @returns The list's status object
     */
    getListStatus: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourceStatus;

    /**
     * Returns a copy of current resource's redux state with an list's status merged with new values
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @param newStatus An object of values to merge into the list's current status object
     * @returns The resource's redux state with the list's new status values
     */
    mergeListStatus: (state: ResourcesReduxState<T>, params: ItemOrListParameters, newStatus: {}) => ResourcesReduxState<T>;

    /**
     * Returns the positions of an list by providing its params
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @returns The list's positions array
     */
    getListPositions: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => Array<ItemOrListParameters>;

    /**
     * Returns a copy of current resource's redux state with item's key removed from the list specified
     * @param state The current resource redux state
     * @param listParams The parameters to serialize to generate the list's key
     * @param itemParams The parameters to serialize to generate the item's key
     * @returns The resource's redux state with the item removed from the list
     */
    removeItemFromListPositions: (state: ResourcesReduxState<T>, listParams: ItemOrListParameters, itemParams: ItemOrListParameters) => Array<ItemOrListParameters>;

    /**
     * Returns a copy of current resource's redux state with an list's positions replaced by new positions
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @param positions An object of positions to replace the list's current positions object
     * @returns The resource's redux state with the list's new positions
     */
    replaceListPositions: (state: ResourcesReduxState<T>, params: ItemOrListParameters, positions: Array<ItemOrListParameters>) => ResourcesReduxState<T>;

    /**
     * Returns the metadata of an list by providing its params
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @returns The list's metadata object
     */
    getListMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => Metadata;

    /**
     * Returns a copy of current resource's redux state with a list's metadata merged with new values
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @param newStatus An object of values to merge into the list's current metadata object
     * @returns The resource's redux state with the list's new metadata values
     */
    mergeListMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters, metadata: {}) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with a list's metadata replaced by new metadata
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @param metadata An object of metadata to replace the list's current metadata object
     * @returns The resource's redux state with the list's new metadata
     */
    replaceListMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters, metadata: {}) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with a list's metadata cleared
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @returns The resource's redux state with the list's new metadata
     */
    clearListMetadata: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with a list omitted
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the list's key
     * @returns The resource's redux state with the list's new values
     */
    clearList: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state an item no longer selected
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the key of the item to deselect
     * @returns The resource's redux state with the item no longer selected
     */
    deselectItem: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;
    deselectItems: (state: ResourcesReduxState<T>, params: Array<ItemOrListParameters>) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with an item added to those already selected
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the key of the item to select
     * @returns The resource's redux state with the item selected
     */
    selectAnotherItem: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;
    selectMoreItems: (state: ResourcesReduxState<T>, params: Array<ItemOrListParameters>) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state with only the specified item selected
     * @param state The current resource redux state
     * @param params The parameters to serialize to generate the key of the item to select
     * @returns The resource's redux state with the item selected
     */
    selectItem: (state: ResourcesReduxState<T>, params: ItemOrListParameters) => ResourcesReduxState<T>;
    selectItems: (state: ResourcesReduxState<T>, params: Array<ItemOrListParameters>) => ResourcesReduxState<T>;

    /**
     * Returns a copy of current resource's redux state no items selected
     * @returns The resource's redux state with the selection cleared
     */
    clearSelectedItems: () => ResourcesReduxState<T>;

    /**
     * Returns an empty resources state, for clearing the entire resource
     * @returns An empty resources state
     */
    clearResources: () => ResourcesReduxState<T>;

    /**
     * Returns an empty singular resource state, for clearing the entire resource
     * @returns An empty resource state
     */
    clearResource: () => ResourcesReduxState<T>;
}

export type CustomReducerFunction<T> = (state: ResourcesReduxState<T>, action: AnyAction, helpers: CustomReducerHelpers<T>) => ResourcesReduxState<T>

export interface CustomReducersMapObject<T> {
    [key: string]: CustomReducerFunction<T>;
}

/**
 * Options used to configure the resource and apply to all actions, unless overridden by more specific
 * configuration in ActionOptions.
 */
export interface ResourceOptions<T> extends GlobalConfigurationOptions {
    /**
     * The pluralized name of the resource you are defining.
     */
    name: string;

    /**
     * A url template that is used for all of the resource's actions. The template string can include required
     * url parameters by prefixing them with a colon (e.g. :id) and optional parameters are denoted by adding
     * a question mark at the end (e.g. :id?). This will be used as the default url template, but individual
     * actions may override it with their own.
     */
    url?: string;

    /**
     * An object that specifies custom reducers in response to actions external to the current resource.
     * The keys of the objects are action types from other resources, your own custom actions outside of
     * redux-and-the-rest, or the name of the action you're enabling on this resource (e.g. fetchItem).
     * The values are the reducer functions.
     */
    reducesOn?: CustomReducersMapObject<T>;

    /**
     * A single or list of actions for which the current resource should be cleared.
     */
    clearOn?: ActionType | Array<ActionType>;

    /**
     * An object of associated resources, with a many-to-many relationship with the current one.
     */
    hasAndBelongsToMany?: Array<string> | AssociationOptions<T>;

    /**
     * An object of associated resources, with a one-to-many relationship with the current one.
     */
    belongsTo?: Array<string> | AssociationOptions<T>;

    beforeReducers?: Array<CustomReducerFunction<T>> | CustomReducerFunction<T>;

    reducer?: keyof StandardActionDictionary | CustomReducerFunction<never>;

    afterReducers?: Array<CustomReducerFunction<T>> | CustomReducerFunction<T>;
}

type ActionCreatorKey = keyof StandardActionDictionary;

export type CustomActionCreatorFunction = (...args: any[]) => AnyAction | ThunkAction<void, any, any, AnyAction>;

/**
 * Options used to configure individual resource actions and override any options specified in GlobalOptions
 * or ResourceOptions.
 */
export interface ActionDefinitionOptions<T> extends ActionAndActionCreatorSharedOptions<T>{
    /**
     * The resource attribute used to key/index all items of the current resource type. This will be the value
     * you pass to each action creator to identify the target of each action. By default, 'id' is used.
     */
    keyBy?: string | Array<string>;

    /**
     * Set to true for resources that should be edited locally, only. The fetch and fetchList actions are disabled
     * (the fetch* action creators are not exported) and the createItem, updateItem and destroyItem only update the store
     * locally, without making any HTTP requests.
     */
    localOnly?: boolean;

    /**
     * A url template that is used for the action. The template string can include required url parameters by
     * prefixing them with a colon (e.g. :id) and optional parameters are denoted by adding a question mark at
     * the end (e.g. :id?).
     */
    url?: string;

    /**
     * The attributes passed to the action's creator used to create the request URL, but ignored when storing
     * the request's response.
     */
    urlOnlyParams?: Array<string>;

    /**
     * The HTTP method to use for the request. Defaults to the standard method used for the particular RESTful
     * action.
     */
    method?: string;

    /**
     * The type value to give the actions dispatched. If this value is not specified, RESTful actions will
     * use a standard default that includes the resource name and the action name, while custom actions
     * will use the key of the action configuration object, attempting to substitute 'Item' for the resource
     * name, or fallback to a name with the action and resource name concatenated together.
     */
    actionName?: string;

    /**
     * Whether the store should emit progress events as the resource is uploaded or downloaded. This is
     * applicable to the RESTful actions fetchList, fetch, create, updateItem and any custom actions.
     */
    progress?: boolean;

    /**
     * Function used to adapt the responses for requests before it is handed over to the reducers. The function
     * must return the results as an object with properties values and (optionally) error.
     */
    responseAdaptor?: ResponseAdaptorFunction

    /**
     * Function used to adapt the JavaScript object before it is handed over to become the body of the request
     * to be sent to an external API.
     */
    requestAdaptor?: (requestBody: T) => Object;

    /**
     * A list of functions to call before passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional pre-processing to standardise the resource before
     * it is added to the store.A list of functions to call before passing the resource to the reducer. This
     * is useful if you want to use the default reducer, but provide some additional pre-processing to
     * standardise the resource before it is added to the store.
     */
    beforeReducers?: Array<CustomReducerFunction<T>> | CustomReducerFunction<T>;

    /**
     * A list of functions to call after passing the resource to the reducer. This is useful if you want to
     * use the default reducer, but provide some additional post-processing to standardise the resource
     * before it is added to the store.
     */
    afterReducers?: Array<CustomReducerFunction<T>> | CustomReducerFunction<T>;

    /**
     * A custom action creator function that returns an action or thunk action that can then be passed to
     * Redux's dispatch function
     */
    actionCreator?: ActionCreatorKey | CustomActionCreatorFunction;

    /**
     * A custom reducer function to adapt the resource as it exists in the Redux store. By default, the
     * standard RESTful reducer is used for RESTful actions, but this attribute is required for Non-RESTful
     * actions.
     */
    reducer?: ActionCreatorKey | CustomReducerFunction<T>;

    /**
     * Whether to include, omit or send cookies that may be stored in the user agent's cookie jar with the
     * request only if it's on the same origin.
     */
    credentials?: RequestCredentials;
}

export type ActionOptionsMap<T> = { [key: string]: ActionDefinitionOptions<T> | Boolean };

/**
 * Defines a new resource, returning the actions, action creators, reducers and helpers to manage it
 */
export function resources<T>(resourceOptions: ResourceOptions<T>, actionOptions: ActionOptionsMap<T> | string[]): ResourcesDefinition<T>;

/**
 * Defines a new singular resource, returning the actions, action creators, reducers and helpers to manage it
 */
export function resource<T>(resourceOptions: ResourceOptions<T>, actionOptions: ActionOptionsMap<T> | string[]): SingularResourceDefinition<T>;

/**
 * Serializes an object to create a consistent key, no matter the ordering of the attributes, suitable to use
 * as a key for resource items and lists.
 */
export function serializeKey(target: any): string | ResourceListId;

/**
 * Updates or sets the global configuration options
 */
export function configure(config: GlobalConfigurationOptions): void;

/**
 * Returns the current global configuration options
 */
export function getConfiguration(): GlobalConfigurationOptions;

/**
 * Whether the last request for an item or list errored, but there is still old values in the store that
 * can be displayed instead.
 * @params itemOrList The item or list to test for old values
 * @returns True if the item or list has errored but has old values that can be displayed
 */
export function canFallbackToOldValues(itemOrList: GenericItemOrList): boolean;

/**
 * The time in milliseconds since the item or list was last requested
 * @param itemOrList The item or list to consider
 * @returns Number of milliseconds since the item or list was requested
 */
export function getTimeSinceFetchStarted(itemOrList: GenericItemOrList): number;

/**
 * The time in milliseconds since the item or list was last synchronised with the external API
 * @param itemOrList The item or list to consider
 * @returns Number of milliseconds since the item or list was last synced with the external API
 */
export function getTimeSinceLastSync(itemOrList: GenericItemOrList): number;

/**
 * The original item values before an edits were performed.
 * @param item The item to return the previous values for
 * @returns The previous values
 */
export function getValuesBeforeEditing<T>(item: ResourcesItem<T>): T;

/**
 * The http status code of the last request related to the resource item or list
 * @param itemOrList The item or list to consider
 * @returns HTTP status code
 */
export function getHttpStatusCode(itemOrList: GenericItemOrList): number;

/**
 * Whether the resource item currently has a particular status
 * @param item The item to evaluate
 * @param status The single status or array of statuses to check against
 * @returns True if the resource item currently has any of the statuses in the list
 */
export function isStatus(item: GenericItemOrList, status: string | Array<string>): boolean;

/**
 * Whether the resource item is new and has yet to be saved to the server
 * @param item The item to evaluate
 * @returns True if the resource item is new
 */
export function isNew(item: GenericItemOrList): boolean;

/**
 * Whether the resource item has been modified since it was last synced with the server
 * @param itemOrList item The item to evaluate
 * @returns True if the resource item can be rolled back
 */
export function isEdited(itemOrList: GenericItemOrList): boolean;

/**
 * Whether the item or list is currently being fetched from the remote
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list is being fetched from the remote
 */
export function isFetching(itemOrList: GenericItemOrList): boolean;

/**
 * Whether the item is currently being created on the remote
 * @param {ResourcesItem|ResourcesList} item The item to consider
 * @returns {boolean} True if the item is being created from the remote
 */
export function isCreating(item: GenericItemOrList): boolean;

/**
 * Whether the item is currently being updated on the remote
 * @param item The item to consider
 * @returns True if the item is currently being updated on the remote
 */
export function isUpdating(item: GenericItemOrList): boolean;

/**
 * Whether the item is currently being destroyed on the remote
 * @param item The item to consider
 * @returns True if the item is currently being destroyed on the remote
 */
export function isDestroying(item: GenericItemOrList): boolean;

/**
 * Whether the item is currently being saved (created or updated) on the remote
 * @param item The item to consider
 * @returns True if the item is currently being saved on the remote
 */
export function isSaving(item: GenericItemOrList): boolean;

/**
 * Whether the item is currently being synced (fetched, created, updated or destroyed) from or on the remote
 * @param item The item to consider
 * @returns True if the item is currently being synced with the remote
 */
export function isSyncing(item: GenericItemOrList): boolean;

/**
 * Whether a resource item or list has exited the provided status and is now in a success or error state
 * @param item The item to evaluate
 * @param status The single status or array of statuses to check against
 * @returns True if the resource item or list has a previous status in the list and is now in either a success
 *          or error status
 */
export function isFinished(item: GenericItemOrList, status: string | Array<string>): boolean;

/**
 * Whether the request to fetch the item or list has finished and is now in a success or error state
 * @param {ResourcesItem|ResourcesList} itemOrList The item or list to consider
 * @returns {boolean} True if the item or list is being fetched from the remote
 */
export function isFinishedFetching(itemOrList: GenericItemOrList): boolean;

/**
 * Whether the request to create the item has finished and is now in a success or error state
 * @param {ResourcesItem|ResourcesList} item The item to consider
 * @returns {boolean} True if the item is being created from the remote
 */
export function isFinishedCreating(item: GenericItemOrList): boolean;

/**
 * Whether the request to update the item has finished and is now in a success or error state
 * @param item The item to consider
 * @returns True if the item is currently being updated on the remote
 */
export function isFinishedUpdating(item: GenericItemOrList): boolean;

/**
 * Whether a list or item is `undefined`, `null` or an empty schema, indicating it was not in the store
 * when it was retrieved. This function is intended to be used with the result of getItem()
 * @param item The item to consider
 * @returns True If the item is not available in the Redux store
 */
export function isNotAvailableLocally(item: GenericItemOrList): boolean;

/**
 * Whether the request to save the item has finished and is now in a success or error state
 * @param item The item to consider
 * @returns True if the item is currently being saved on the remote
 */
export function isFinishedSaving(item: GenericItemOrList): boolean;

/**
 * Whether the request to sync the item is has finished and is now in a success or error state
 * @param item The item to consider
 * @returns True if the item is currently being synced with the remote
 */
export function isFinishedSyncing(item: GenericItemOrList): boolean;


/**
 * Whether the item or list has successfully synced
 * @param itemOrList The item or list to consider
 * @returns True if the item or list was successfully synced
 */
export function isSuccess(itemOrList: GenericItemOrList): boolean;

/**
 * Whether the item or list is in an errored state - usually because the last sync failed
 * @param itemOrList The item or list to consider
 * @returns True if the item or list is in an errored state
 */
export function isError(itemOrList: GenericItemOrList): boolean;

/**
 * Whether the supplied key matches the current new item key
 * @param resource The current resource state
 * @param key The key to check for a match against the new item key
 * @returns True the key matches the new item key
 */
export function isNewItemKey<T>(resource: ResourcesReduxState<T>, key: ItemOrListParameters): boolean;
