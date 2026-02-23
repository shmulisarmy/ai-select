const { launchBrowser, askChatGpt, closeBrowser } = require('../lib/browser');
const { jsonFinder, validateJson } = require('../lib/utils');

module.exports = async function handler(req, res) {
  const text = req.query.text;
  const schema = req.query.schema;

  if (!text || !schema) {
    return res.status(400).json({ error: 'Missing query parameter "text" or "schema"' });
  }

  let parsedSchema;
  try {
    parsedSchema = JSON.parse(schema);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON in "schema" parameter' });
  }

  let browser;
  try {
    const result = await launchBrowser();
    browser = result.browser;
    const page = result.page;

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      const prompt = `from the following document, extract the data in the json format of ${JSON.stringify(parsedSchema)}. the text is as follows:\n${text}`;
      const answer = await askChatGpt(page, prompt);
      const json = jsonFinder(answer);
      if (json && validateJson(json, parsedSchema)) {
        return res.json({ text, extracted: json });
      }
    }

    res.status(500).json({ error: 'Could not extract valid JSON after retries' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await closeBrowser(browser);
  }
};
