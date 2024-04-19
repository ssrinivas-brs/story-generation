
var resultText;
var zIndex = 0;
const search = document.querySelector('#submit');
const searchQuery = document.querySelector('#searchQuery');
const results = document.querySelector('#results');
const difficulty = document.querySelector('#difficulty');
const res_blk = document.querySelector('#res_blk');
const err_blk = document.querySelector('#err_blk');
const book = document.querySelector('#book');
const loader = document.querySelector('#loader');
const book_blk = document.querySelector('#book_blk');
const query_blk = document.querySelector('#query_blk');
const another_story = document.querySelector('#another_story');
const input_ele = document.querySelectorAll('input');
const openAiUrl = 'https://api.openai.com/v1/completions';
const imageGenerationURL = 'https://api.openai.com/v1/images/generations';
const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${window.OPEN_AI_KEY}`
}

async function getCompletions() {
  let prompt;
  loader.classList.remove('d-none');
  res_blk.classList.add('d-none');
  resultText = null;
  err_blk.classList.add('d-none');
  err_blk.innerHTML = null;

  prompt = `"""Generate a long story depending on below prompts.\n\n
  character: ${character.value.replace(/\?/g, '')}\n
  prompt: ${character_prompt.value.replace(/\?/g, '')}\n
  image_prompt: ${image_prompt.value.replace(/\?/g, '')}\n
  moral: ${moral.value.replace(/\?/g, '')}\n
  name: ${storyname.value.replace(/\?/g, '')}\n
  storytype: story"""`;

  const data = {
    model: "gpt-3.5-turbo-instruct",
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 500,
    n: 1,
    prompt
  }

  const dataObj = {
    method: 'POST',
    cache: 'no-cache',
    headers: headers,
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  }

  try {
    const response = await fetch(openAiUrl,dataObj);
    const aresponseData = await response.json();
    if(aresponseData.error) {throw aresponseData.error}
    var storyData = aresponseData.choices[0]?.text;
    if(storyData.startsWith('\n\n')) {
      storyData = storyData.substr(2);
    }
    storyData = storyData.split(/\n\n/g);

    const imgData = {
      prompt: image_prompt.value.replace(/\?/g, '') + ' in a photorealistic style',
      n: 5,
      response_format: 'b64_json',
      size: "256x256"
    }

    const imgDataObj = {
      method: 'POST',
      cache: 'no-cache',
      headers: headers,
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(imgData)
    }

    const imgResponse = await fetch(imageGenerationURL,imgDataObj);
    const responseData = await imgResponse.json();
    if(responseData.error) {throw responseData.error}
    const carousel_data = storyData.map((e,i) => {
      const image_url = 'data:image/png;base64,' + responseData.data[i]?.b64_json;
      return `
        <div class="page">
          <div class="page-content">
            <div class="page-footer">Page ${i+1} of ${storyData.length}</div>
            <span>${e}</span>
            <div class="page-image" style="background-image: url(${image_url})"></div>
          </div>
        </div>
      `
    }).join('');
    const cover_page = `
    <div class="page page-cover page-cover-top" data-density="hard">
      <div class="page-content">
        <h2>${storyname.value}</h2>
      </div>
    </div>
    `
    var book_data = cover_page.concat(carousel_data)
    book.innerHTML = book_data.concat(
      `<div class="page page-cover page-cover-bottom">
        <div class="page-content">
          <h2>THE END</h2>
        </div>
      </div>`
    )
    query_blk.classList.add('d-none');
    book_blk.classList.remove('d-none');
    initiatPageFlip();
    loader.classList.add('d-none');
    res_blk.classList.remove('d-none');
  } catch (error) {
    console.log(error);
    err_blk.classList.remove('d-none');
    err_blk.innerHTML = error.message;
    loader.classList.add('d-none');
  }

}

input_ele.forEach((element) => {
  element.addEventListener('mouseover', function() {
    if(element.value) { element.value = null; }
  })
})

another_story.addEventListener('click', function() {
  character.value = '';
  character_prompt.value = '';
  image_prompt.value = '';
  moral.value = '';
  storyname.value = '';
  book_blk.classList.add('d-none');
  query_blk.classList.remove('d-none');
})

function setTheme(theme) {
  document.documentElement.style.setProperty('--primary-color', theme);
  localStorage.setItem('iss-theme', theme);
}

setTheme(localStorage.getItem('iss-theme') || '#1A4B84');

const initiatPageFlip = () => {
  const pageFlipStyles = {
    width: 500,
    height: 350,
    size: "stretch",
    minWidth: 500,
    maxWidth: 500,
    minHeight: 350,
    maxHeight: 350,
    showCover: true,
    maxShadowOpacity: 0.5,
    mobileScrollSupport: false
  }
  const pageFlip = new St.PageFlip(book, pageFlipStyles);
  // load pages
  pageFlip.loadFromHTML(document.querySelectorAll(".page"));
}
