const { launchBrowser, askChatGpt, closeBrowser } = require('../lib/browser');

module.exports = async function handler(req, res) {
  const question = req.query.q;
  if (!question) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  let browser;
  try {
    const result = await launchBrowser();
    browser = result.browser;
    const page = result.page;

    const answer = await askChatGpt(page, question);
    res.json({ question, answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    await closeBrowser(browser);
  }
};
