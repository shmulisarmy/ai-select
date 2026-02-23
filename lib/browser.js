const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Launch a browser and return { browser, page } with ChatGPT loaded
 * and helper functions injected.
 *
 * In production (Vercel), uses @sparticuz/chromium.
 * Locally, uses the system Chrome.
 */
async function launchBrowser() {
  let browser;

  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL) {
    // Running on Vercel / AWS Lambda
    const chromium = require('@sparticuz/chromium');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  } else {
    // Local development — find system Chrome
    const { execSync } = require('child_process');
    let chromePath;
    try {
      chromePath = execSync(
        'find /Applications -name "Google Chrome" -maxdepth 3 2>/dev/null | head -1'
      ).toString().trim();
    } catch {
      chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
    browser = await puppeteer.launch({
      headless: false,
      executablePath: chromePath,
    });
  }

  const page = await browser.newPage();
  await page.goto('https://chatgpt.com', { waitUntil: 'networkidle2', timeout: 30000 });

  // Inject helper functions into the page
  await page.evaluate(() => {
    window.sleep = function (ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    };

    window.sendAiMessage = function (message) {
      const editor = document.querySelector('#prompt-textarea');
      if (editor) {
        editor.focus();
        document.execCommand('insertText', false, message);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
          const sendButton = document.querySelector('button[data-testid="send-button"]');
          if (sendButton && !sendButton.disabled) {
            sendButton.click();
          }
        }, 100);
      }
    };

    window.selectChatGptResponse = function () {
      const paragraphs = document.querySelectorAll(
        'p[data-start][data-end][data-is-last-node][data-is-only-node]'
      );
      const arr = Array.from(paragraphs);
      const last = arr[arr.length - 1];
      return last ? last.textContent : '';
    };
  });

  return { browser, page };
}

/**
 * Ask ChatGPT a question and return the response text.
 */
async function askChatGpt(page, question) {
  return page.evaluate(async (q) => {
    sendAiMessage(q);
    await sleep(2000);
    return selectChatGptResponse();
  }, question);
}

/**
 * Close the browser.
 */
async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
  }
}

module.exports = { launchBrowser, askChatGpt, closeBrowser, sleep };
