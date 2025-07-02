// Content script for AI Tab Assistant

// Function to get page text content
function getPageText() {
  // Try to get article content first
  const article = document.querySelector("article");
  if (article) return article.innerText;

  // Fallback to main content areas
  const main = document.querySelector("main");
  if (main) return main.innerText;

  // Fallback to paragraphs
  const paragraphs = Array.from(document.querySelectorAll("p"));
  return paragraphs.map((p) => p.innerText).join("\n");
}

// Function to get page metadata
function getPageMetadata() {
  const title = document.title;
  const url = window.location.href;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
  
  return {
    title,
    url,
    description,
    keywords
  };
}

// Function to get page structure
function getPageStructure() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .map(h => ({
      level: h.tagName.toLowerCase(),
      text: h.innerText.trim()
    }));

  const links = Array.from(document.querySelectorAll('a[href]'))
    .slice(0, 20) // Limit to first 20 links
    .map(a => ({
      text: a.innerText.trim(),
      href: a.href
    }));

  const images = Array.from(document.querySelectorAll('img'))
    .slice(0, 10) // Limit to first 10 images
    .map(img => ({
      alt: img.alt || '',
      src: img.src
    }));

  const forms = Array.from(document.querySelectorAll('form'))
    .map(form => ({
      action: form.action || '',
      method: form.method || 'get',
      inputs: Array.from(form.querySelectorAll('input, select, textarea'))
        .map(input => ({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name || '',
          placeholder: input.placeholder || ''
        }))
    }));

  return {
    headings,
    links,
    images,
    forms
  };
}

// Function to identify interactive elements for testing
function getTestableElements() {
  const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"]'))
    .map(btn => ({
      type: 'button',
      text: btn.innerText || btn.value || '',
      id: btn.id || '',
      className: btn.className || ''
    }));

  const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
    .map(input => ({
      type: 'input',
      inputType: input.type || input.tagName.toLowerCase(),
      name: input.name || '',
      id: input.id || '',
      placeholder: input.placeholder || '',
      required: input.required || false
    }));

  const clickableElements = Array.from(document.querySelectorAll('a, [onclick], [role="button"]'))
    .slice(0, 20)
    .map(el => ({
      type: 'clickable',
      text: el.innerText.trim(),
      href: el.href || '',
      role: el.role || ''
    }));

  return {
    buttons,
    inputs,
    clickableElements
  };
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "GET_PAGE_TEXT":
      sendResponse({ text: getPageText() });
      break;
      
    case "GET_PAGE_METADATA":
      sendResponse(getPageMetadata());
      break;
      
    case "GET_PAGE_STRUCTURE":
      sendResponse(getPageStructure());
      break;
      
    case "GET_TESTABLE_ELEMENTS":
      sendResponse(getTestableElements());
      break;
      
    case "GET_FULL_PAGE_INFO":
      sendResponse({
        text: getPageText(),
        metadata: getPageMetadata(),
        structure: getPageStructure(),
        testableElements: getTestableElements()
      });
      break;
      
    default:
      sendResponse({ error: "Unknown request type" });
  }
});