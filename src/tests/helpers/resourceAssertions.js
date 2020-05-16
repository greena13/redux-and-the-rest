import EmptyKey from '../../constants/EmptyKey';
import getItem from '../../utils/getItem';
import isUndefined from '../../utils/isUndefined';
import buildStore from './buildStore';
import { RESOURCES } from '../..';
import getCollection from '../../utils/getCollection';

/** ***************************************************************************************
 * Shared helpers
 ******************************************************************************************/

export function expectToChangeNewItemKeyTo(context, resourceName, value){
  expect(resourceDefinition(context, resourceName).newItemKey).toEqual(value);
}

export function expectToNotChangeNewItemKey(context, resourceName){
  expect(resourceDefinition(context, resourceName).newItemKey).toEqual(context.initialState.newItemKey);
}

export function expectToChangeSelectionMapTo(context, resourceName, value){
  expect(resourceDefinition(context, resourceName).selectionMap).toEqual(value);
}

export function expectToNotChangeSelectionMap(context, resourceName){
  expect(resourceDefinition(context, resourceName).selectionMap).toEqual(context.initialState.selectionMap);
}


export function setupInitialState(context, resourceName, initialState) {
  context.initialState = initialState;

  context.store = buildStore({
    [resourceName]: { ...RESOURCES, ...initialState }
  }, { [resourceName]: context.reducers } );
}

/** ***************************************************************************************
 * resource helpers
 ******************************************************************************************/

/**
 * Positive assertions
 */

export function expectToChangeResourceItemStatusTo(context, resourcesName, subkeyOrExpectedValue, expectedValue = undefined) {
  expectToChangeResourceItemTo(context, resourcesName, 'status', subkeyOrExpectedValue, expectedValue);
}

export function expectToClearResourceItemStatus(context, resourcesName, subkey) {
  expectToChangeResourceItemStatusTo(context, resourcesName, subkey, undefined);
}

export function expectToChangeResourceItemValuesTo(context, resourcesName, subkeyOrExpectedValue, expectedValue = undefined) {
  expectToChangeResourceItemTo(context, resourcesName, 'values', subkeyOrExpectedValue, expectedValue);
}

function expectToChangeResourceItemTo(context, resourcesName, key, subkeyOrExpectedValue, expectedValue = undefined) {
  expectResourcesItemToChangeTo(context, resourcesName, EmptyKey, key, subkeyOrExpectedValue, expectedValue);
}

export function expectToChangeResourceItemStatusErrorOccurredAtToBeSet(context, resourceName) {
  expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(context, resourceName, EmptyKey);
}

/**
 * Negated assertions
 */

export function expectToNotChangeResourceItemStatus(context, resourcesName, value = undefined) {
  expectToNotChangeResourceItem(context, resourcesName, 'status', value);
}

export function expectToNotChangeResourceItemValues(context, resourcesName, value = undefined) {
  expectToNotChangeResourceItem(context, resourcesName, 'values', value);
}

export function expectToNotChangeResourceItem(context, resourcesName, key, subkey = undefined) {
  expectToNotChangeResourcesItem(context, resourcesName, EmptyKey, key, subkey);
}

/**
 * Getters
 */

export function resourceItem(context, resourcesName) {
  return resourcesItem(context, resourcesName, EmptyKey);
}

export function resourceDefinition(context, resourceName) {
  return resourcesDefinition(context, resourceName);
}

/** ***************************************************************************************
 * resources helpers
 ******************************************************************************************/

/**
 * Positive assertions
 */

export function expectToChangeResourcesItemStatusTo(context, resourcesName, id, subkeyOrExpectedValue, expectedValue = undefined) {
  expectResourcesItemToChangeTo(context, resourcesName, id, 'status', subkeyOrExpectedValue, expectedValue);
}

export function expectToClearResourcesItemStatus(context, resourcesName, id, subkey) {
  expectToChangeResourcesItemStatusTo(context, resourcesName, id, subkey, undefined);
}

export function expectToChangeResourcesItemStatusErrorOccurredAtToBeSet(context, resourceName, id) {
  expect(resourcesItem(context, resourceName, id).status.errorOccurredAt).not.toBeUndefined();
}

export function expectToChangeResourcesItemValuesTo(context, resourcesName, id, subkeyOrExpectedValue, expectedValue = undefined) {
  expectResourcesItemToChangeTo(context, resourcesName, id, 'values', subkeyOrExpectedValue, expectedValue);
}

export function expectToChangeResourceCollectionStatusTo(context, resourcesName, id, subkeyOrExpectedValue, expectedValue = undefined) {
  expectResourcesCollectionToChangeTo(context, resourcesName, id, 'status', subkeyOrExpectedValue, expectedValue);
}
export function expectToChangeResourceCollectionPositionsTo(context, resourcesName, id, expectedValue) {
  expectResourcesCollectionToChangeTo(context, resourcesName, id, 'positions', expectedValue);
}

export function expectToChangeResourcesCollectionStatusErrorOccurredAtToBeSet(context, resourceName, id) {
  expect(resourcesCollection(context, resourceName, id).status.errorOccurredAt).not.toBeUndefined();
}

function expectResourcesItemToChangeTo(context, resourcesName, id, key, subkeyOrExpectedValue, expectedValue = undefined) {
  expectResourcesToChangeTo(context, resourcesName, 'items', id, key, subkeyOrExpectedValue, expectedValue);
}

function expectResourcesCollectionToChangeTo(context, resourcesName, id, key, subkeyOrExpectedValue, expectedValue = undefined) {
  expectResourcesToChangeTo(context, resourcesName, 'collections', id, key, subkeyOrExpectedValue, expectedValue);
}

function expectResourcesToChangeTo(context, resourcesName, type, id, key, subkeyOrExpectedValue, expectedValue = undefined) {
  const newValue = resourcesDefinition(context, resourcesName)[type][id][key];

  if (isUndefined(subkeyOrExpectedValue)) {
    expect(newValue).toEqual(subkeyOrExpectedValue);
  } else {
    expect(newValue[subkeyOrExpectedValue]).toEqual(expectedValue);
  }
}

/**
 * Negated assertions
 */

export function expectToNotChangeResourcesItemValues(context, resourcesName, id, value = undefined) {
  expectToNotChangeResourcesItem(context, resourcesName, id, 'values', value);
}

export function expectToNotChangeResourcesItemStatus(context, resourcesName, id, value = undefined) {
  expectToNotChangeResourcesItem(context, resourcesName, id, 'status', value);
}

export function expectToNotChangeResourcesItem(context, resourcesName, id, attribute, value = undefined) {
  expectToNotChangeResources(context, resourcesName, 'items', id, attribute, value);
}

export function expectToNotChangeResourceCollectionStatus(context, resourcesName, id, subkeyOrExpectedValue) {
  expectToNotChangeResourcesCollection(context, resourcesName, id, 'status', subkeyOrExpectedValue);
}
export function expectToNotChangeResourceCollectionPositions(context, resourcesName, id) {
  expectToNotChangeResourcesCollection(context, resourcesName, id, 'positions');
}

export function expectToNotChangeResourcesCollection(context, resourcesName, id, attribute = undefined, value = undefined) {
  expectToNotChangeResources(context, resourcesName, 'collections', id, attribute, value);
}

export function expectToNotChangeResources(context, resourcesName, type, id, attribute = undefined, value = undefined) {
  let newValue = resourcesDefinition(context, resourcesName)[type][id];
  let initialValue = context.initialState[type][id];

  if (!isUndefined(attribute)) {
    newValue = newValue[attribute];
    initialValue = initialValue[attribute];
  }

  if (isUndefined(value)) {
    expect(newValue).toEqual(initialValue);
  } else {
    expect(newValue[value]).toEqual(initialValue[value]);
  }
}

/**
 * Getters
 */

export function resourcesItem(context, resourcesName, id) {
  return getItem(resourcesDefinition(context, resourcesName), id);
}
export function resourcesCollection(context, resourcesName, id) {
  return getCollection(resourcesDefinition(context, resourcesName), id);
}

export function resourcesDefinition(context, resourceName) {
  return context.store.getState()[resourceName];
}
