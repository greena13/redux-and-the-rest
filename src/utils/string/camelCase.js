function camelCase(string) {
  return string.
    replace(/([A-Z][A-Z]+)/g, (arg1, match) => match.slice(0, 1) + match.slice(1).toLowerCase()).
    replace(/-|_([A-z])/g, (arg1, match) => match.toUpperCase()).
    replace(/-|_/g, '').
    replace(/^(.)/, (arg1, match) => match.toLowerCase());
}

export default camelCase;
