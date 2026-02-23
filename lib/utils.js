function jsonFinder(text) {
  const lookFor = "```json";
  const lookForEnd = "```";

  const startIndex = text.indexOf(lookFor);
  const endIndex = text.indexOf(lookForEnd, startIndex + lookFor.length);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const j_string = text.substring(startIndex + lookFor.length, endIndex).trim();
    return JSON.parse(j_string);
  } else {
    return null;
  }
}

function validateJson(json, schema) {
  for (const key in schema) {
    if (typeof json[key] !== schema[key]) {
      return false;
    }
  }
  return true;
}

module.exports = { jsonFinder, validateJson };
