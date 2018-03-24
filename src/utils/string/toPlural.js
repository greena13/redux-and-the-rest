import pluralize from 'pluralize';

function toPlural(string) {
  return pluralize.plural(string);
}

export default toPlural;
