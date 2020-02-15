import camelCase from '../../utils/string/camelCase';

function getActionCreatorNameFrom(actionName) {
  return camelCase(actionName);
}

export default getActionCreatorNameFrom;
