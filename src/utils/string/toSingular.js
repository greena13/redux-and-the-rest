import pluralize from 'pluralize';

function toSingular(string) {
  return pluralize.singular(string);
}

export default toSingular;
