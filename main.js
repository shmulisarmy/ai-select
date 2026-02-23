const { exec } = require('child_process');
const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



function jsonFinder(text) {
 const lookFor = "```json"; 
 const lookForEnd = "```";

 const startIndex = text.indexOf(lookFor);
 const endIndex = text.indexOf(lookForEnd, startIndex + lookFor.length);

 console.log({startIndex});
 console.log({endIndex});
 

 if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const j_string = text.substring(startIndex + lookFor.length, endIndex).trim();
    console.log({j_string});
    return JSON.parse(j_string);
 } else {
    return null;
 }
}


const jsonSchemaExample = {
    name: "string",
    age: "number",
    city: "string",
    state: "string",
    first_job_title: "string",
    last_reference_phone_number: "string"
}




function validateJson(json, schema){
 for (const key in schema) {
    if (typeof json[key] !== schema[key]) {
        return false;
    }
 }
 return true;
}


console.log(jsonFinder("heres your response: ```json {\"name\": \"John\", \"age\": 30, \"city\": \"New York\"} ```"));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to ChatGPT
  await page.goto('https://chatgpt.com');

  

  // Now your server can "inject" the code into the page directly
  // without CSP blocking the connection, because you OWN the browser instance.
  await page.evaluate(() => {
    window.sendAiMessage = function(message) {
    const editor = document.querySelector('#prompt-textarea');
    
    if (editor) {
        editor.focus();
        // Insert the text
        document.execCommand('insertText', false, message);

        // Manually trigger an input event so the UI knows the text is there
        editor.dispatchEvent(new Event('input', { bubbles: true }));

        // Use a slight delay to give the button time to enable
        setTimeout(() => {
            const sendButton = document.querySelector('button[data-testid="send-button"]');
            
            if (sendButton && !sendButton.disabled) {
                sendButton.click();
                console.log("Success: Message sent!");
            } else {
                console.error("The button is still disabled. Try clicking it manually!");
            }
        }, 100); 
    } else {
        console.error("Could not find the prompt-textarea.");
    }
};


window.selectChatGptResponse = function() {
  const paragraphs = document.querySelectorAll('p[data-start][data-end][data-is-last-node][data-is-only-node]');
  const paragraphsArray = Array.from(paragraphs);
  console.log({paragraphsArray});
  const lastParagraph = paragraphsArray[paragraphsArray.length - 1];
  console.log({lastParagraph});
  const text = lastParagraph.textContent;
  console.log({text});
  return text;
}
window.sleep = async function(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  })

  function askChatGpt(question) {
    return page.evaluate(async (question) => {
    sendAiMessage(question);
    await sleep(2000);
    return selectChatGptResponse();
  }, question);
  }
  function jsonExtractor(text, schema, retry = 0){
    const prompt = `from the following document, extract the data in the json format of ${schema}s. the text is as follows: 
    ${text}`;

    for (let i = 0; i < retry; i++) {
        const res = askChatGpt(prompt);
        const json = jsonFinder(res);
        if (validateJson(json, schema)) {
            return json;
        }
    }
    throw new Error("Could not extract json");
}

//   await sleep(2000);

//   console.log(await askChatGpt("Hello from the future!"));

//   console.log(await askChatGpt("What is the capital of France?"));


  


  
})();

