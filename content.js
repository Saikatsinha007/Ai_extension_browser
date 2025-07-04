// Content script for AI Tab Assistant Pro - Enhanced Page Analysis

// Enhanced function to get page text content with better content extraction
function getPageText() {
  try {
    // Priority order for content extraction
    const contentSelectors = [
      'article',
      'main', 
      '[role="main"]',
      '.content',
      '#content',
      '.post-content',
      '.entry-content'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 100) {
        return cleanText(element.innerText);
      }
    }

    // Fallback to paragraphs if no main content area found
    const paragraphs = Array.from(document.querySelectorAll('p, li, div'))
      .filter(el => el.innerText.trim().length > 20)
      .slice(0, 50);
    
    return cleanText(paragraphs.map(p => p.innerText).join('\n'));
  } catch (error) {
    console.error('Error extracting page text:', error);
    return 'Could not extract page content';
  }
}

// Enhanced function to get comprehensive page metadata
function getPageMetadata() {
  try {
    const title = document.title || 'Untitled Page';
    const url = window.location.href;
    const description = getMetaContent('description') || getMetaContent('og:description') || '';
    const keywords = getMetaContent('keywords') || '';
    const author = getMetaContent('author') || getMetaContent('article:author') || '';
    const publishDate = getMetaContent('article:published_time') || getMetaContent('date') || '';
    const siteName = getMetaContent('og:site_name') || getDomainName(url);
    const pageType = getMetaContent('og:type') || determinePageType();
    const language = document.documentElement.lang || getMetaContent('language') || 'en';
    
    return {
      title,
      url,
      description,
      keywords,
      author,
      publishDate,
      siteName,
      pageType,
      language,
      favicon: getFaviconUrl(),
      viewport: getViewportInfo()
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return { title: 'Error', url: window.location.href };
  }
}

// Enhanced function to get detailed page structure
function getPageStructure() {
  try {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({
        level: h.tagName.toLowerCase(),
        text: cleanText(h.innerText),
        id: h.id || '',
        className: h.className || ''
      }))
      .filter(h => h.text.length > 0);

    const links = Array.from(document.querySelectorAll('a[href]'))
      .slice(0, 30)
      .map(a => ({
        text: cleanText(a.innerText),
        href: a.href,
        isExternal: isExternalLink(a.href),
        hasImage: a.querySelector('img') !== null,
        ariaLabel: a.getAttribute('aria-label') || ''
      }))
      .filter(link => link.text.length > 0 || link.ariaLabel.length > 0);

    const images = Array.from(document.querySelectorAll('img'))
      .slice(0, 15)
      .map(img => ({
        alt: img.alt || '',
        src: img.src || '',
        title: img.title || '',
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
        loading: img.loading || ''
      }))
      .filter(img => img.src.length > 0);

    const forms = Array.from(document.querySelectorAll('form'))
      .map(form => ({
        action: form.action || '',
        method: form.method || 'get',
        name: form.name || '',
        id: form.id || '',
        inputs: Array.from(form.querySelectorAll('input, select, textarea'))
          .map(input => ({
            type: input.type || input.tagName.toLowerCase(),
            name: input.name || '',
            id: input.id || '',
            placeholder: input.placeholder || '',
            required: input.required || false,
            value: input.type === 'password' ? '[HIDDEN]' : (input.value || ''),
            label: getInputLabel(input)
          }))
      }));

    const navigation = getNavigationStructure();
    const tables = getTableData();
    const videos = getVideoElements();

    return {
      headings,
      links,
      images,
      forms,
      navigation,
      tables,
      videos,
      landmarks: getLandmarkElements(),
      socialMedia: getSocialMediaLinks()
    };
  } catch (error) {
    console.error('Error extracting page structure:', error);
    return { headings: [], links: [], images: [], forms: [] };
  }
}

// Enhanced function to identify comprehensive testable elements
function getTestableElements() {
  try {
    const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]'))
      .map(btn => ({
        type: 'button',
        text: cleanText(btn.innerText || btn.value || btn.title || ''),
        id: btn.id || '',
        className: btn.className || '',
        disabled: btn.disabled || false,
        ariaLabel: btn.getAttribute('aria-label') || '',
        onclick: btn.onclick !== null,
        buttonType: btn.type || 'button'
      }))
      .filter(btn => btn.text.length > 0 || btn.ariaLabel.length > 0);

    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      .map(input => ({
        type: 'input',
        inputType: input.type || input.tagName.toLowerCase(),
        name: input.name || '',
        id: input.id || '',
        placeholder: input.placeholder || '',
        required: input.required || false,
        disabled: input.disabled || false,
        readonly: input.readOnly || false,
        label: getInputLabel(input),
        validation: getInputValidation(input),
        autocomplete: input.autocomplete || ''
      }));

    const clickableElements = Array.from(document.querySelectorAll('a, [onclick], [role="button"], [role="link"], [role="tab"], [role="menuitem"]'))
      .slice(0, 25)
      .map(el => ({
        type: getElementRole(el),
        text: cleanText(el.innerText),
        href: el.href || '',
        role: el.role || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        tabIndex: el.tabIndex || 0,
        hasKeyboardHandler: hasKeyboardEventListener(el)
      }))
      .filter(el => el.text.length > 0 || el.ariaLabel.length > 0);

    const interactiveElements = getInteractiveElements();
    const formValidation = getFormValidationRules();

    return {
      buttons,
      inputs,
      clickableElements,
      interactiveElements,
      formValidation,
      accessibility: getAccessibilityFeatures(),
      performance: getPerformanceMetrics()
    };
  } catch (error) {
    console.error('Error extracting testable elements:', error);
    return { buttons: [], inputs: [], clickableElements: [] };
  }
}

// New function to get accessibility features
function getAccessibilityFeatures() {
  return {
    skipLinks: document.querySelectorAll('a[href^="#"]').length,
    headingStructure: checkHeadingHierarchy(),
    altTexts: Array.from(document.querySelectorAll('img')).filter(img => img.alt).length,
    focusableElements: document.querySelectorAll('[tabindex]:not([tabindex="-1"])').length,
    ariaLabels: document.querySelectorAll('[aria-label], [aria-labelledby]').length,
    roles: Array.from(document.querySelectorAll('[role]')).map(el => el.role),
    landmarks: document.querySelectorAll('nav, main, aside, footer, header, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]').length
  };
}

// New function to get performance metrics
function getPerformanceMetrics() {
  return {
    totalImages: document.querySelectorAll('img').length,
    totalLinks: document.querySelectorAll('a').length,
    totalScripts: document.querySelectorAll('script').length,
    totalStylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
    inlineStyles: document.querySelectorAll('[style]').length,
    domSize: document.querySelectorAll('*').length,
    hasLazyLoading: document.querySelectorAll('img[loading="lazy"]').length > 0
  };
}

// Helper functions
function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function getMetaContent(name) {
  const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return meta ? meta.content : '';
}

function getDomainName(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function determinePageType() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  
  if (url.includes('login') || title.includes('login')) return 'login';
  if (url.includes('admin') || url.includes('dashboard')) return 'admin';
  if (url.includes('shop') || url.includes('store')) return 'ecommerce';
  if (document.querySelector('article')) return 'article';
  if (document.querySelector('form')) return 'form';
  
  return 'webpage';
}

function getFaviconUrl() {
  const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  return favicon ? favicon.href : '';
}

function getViewportInfo() {
  const viewport = document.querySelector('meta[name="viewport"]');
  return viewport ? viewport.content : '';
}

function isExternalLink(href) {
  try {
    return new URL(href).hostname !== window.location.hostname;
  } catch {
    return false;
  }
}

function getInputLabel(input) {
  // Try to find associated label
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return cleanText(label.innerText);
  }
  
  // Check if input is inside a label
  const parentLabel = input.closest('label');
  if (parentLabel) return cleanText(parentLabel.innerText);
  
  // Check for aria-labelledby
  if (input.getAttribute('aria-labelledby')) {
    const labelElement = document.getElementById(input.getAttribute('aria-labelledby'));
    if (labelElement) return cleanText(labelElement.innerText);
  }
  
  return input.getAttribute('aria-label') || input.title || '';
}

function getInputValidation(input) {
  return {
    required: input.required,
    pattern: input.pattern || '',
    min: input.min || '',
    max: input.max || '',
    minLength: input.minLength || 0,
    maxLength: input.maxLength || 0,
    step: input.step || ''
  };
}

function getElementRole(element) {
  if (element.role) return element.role;
  if (element.tagName === 'A') return 'link';
  if (element.tagName === 'BUTTON') return 'button';
  if (element.onclick) return 'clickable';
  return 'interactive';
}

function hasKeyboardEventListener(element) {
  return element.onkeydown !== null || element.onkeyup !== null || element.onkeypress !== null;
}

function getNavigationStructure() {
  const navElements = Array.from(document.querySelectorAll('nav, [role="navigation"]'));
  return navElements.map(nav => ({
    type: nav.tagName.toLowerCase(),
    ariaLabel: nav.getAttribute('aria-label') || '',
    linkCount: nav.querySelectorAll('a').length,
    hasDropdown: nav.querySelector('ul ul, .dropdown') !== null
  }));
}

function getTableData() {
  const tables = Array.from(document.querySelectorAll('table'));
  return tables.slice(0, 5).map(table => ({
    caption: table.caption ? table.caption.innerText : '',
    headers: Array.from(table.querySelectorAll('th')).map(th => th.innerText),
    rowCount: table.querySelectorAll('tr').length,
    columnCount: table.querySelectorAll('th, td').length / table.querySelectorAll('tr').length || 0,
    hasScope: table.querySelector('th[scope]') !== null
  }));
}

function getVideoElements() {
  const videos = Array.from(document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]'));
  return videos.map(video => ({
    type: video.tagName.toLowerCase(),
    src: video.src || video.getAttribute('data-src') || '',
    hasControls: video.controls || false,
    autoplay: video.autoplay || false,
    muted: video.muted || false
  }));
}

function getLandmarkElements() {
  const landmarks = ['header', 'nav', 'main', 'aside', 'footer', '[role="banner"]', '[role="navigation"]', '[role="main"]', '[role="complementary"]', '[role="contentinfo"]'];
  return landmarks.map(selector => ({
    type: selector,
    count: document.querySelectorAll(selector).length
  })).filter(landmark => landmark.count > 0);
}

function getSocialMediaLinks() {
  const socialDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'github.com'];
  const socialLinks = Array.from(document.querySelectorAll('a[href]'))
    .filter(link => socialDomains.some(domain => link.href.includes(domain)))
    .map(link => ({
      platform: socialDomains.find(domain => link.href.includes(domain)),
      url: link.href,
      text: cleanText(link.innerText || link.getAttribute('aria-label') || '')
    }));
  return socialLinks;
}

function getInteractiveElements() {
  const selectors = ['[draggable="true"]', '[contenteditable="true"]', 'details', 'dialog', '[role="dialog"]', '[role="alertdialog"]'];
  return selectors.map(selector => ({
    type: selector,
    count: document.querySelectorAll(selector).length,
    elements: Array.from(document.querySelectorAll(selector)).slice(0, 3).map(el => ({
      text: cleanText(el.innerText).substring(0, 50),
      id: el.id || '',
      className: el.className || ''
    }))
  })).filter(item => item.count > 0);
}

function getFormValidationRules() {
  const forms = Array.from(document.querySelectorAll('form'));
  return forms.map(form => ({
    id: form.id || '',
    name: form.name || '',
    hasValidation: form.noValidate === false,
    requiredFields: form.querySelectorAll('[required]').length,
    patternFields: form.querySelectorAll('[pattern]').length,
    emailFields: form.querySelectorAll('input[type="email"]').length,
    passwordFields: form.querySelectorAll('input[type="password"]').length
  }));
}

function checkHeadingHierarchy() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const levels = headings.map(h => parseInt(h.tagName.charAt(1)));
  
  let isValid = true;
  let currentLevel = 0;
  
  for (const level of levels) {
    if (currentLevel === 0) {
      currentLevel = level;
    } else if (level > currentLevel + 1) {
      isValid = false;
      break;
    }
    currentLevel = level;
  }
  
  return { isValid, h1Count: levels.filter(l => l === 1).length, totalHeadings: levels.length };
}

// Enhanced message handler with error boundaries
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
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
          testableElements: getTestableElements(),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screenSize: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        });
        break;
        
      case "GET_ACCESSIBILITY_INFO":
        sendResponse(getAccessibilityFeatures());
        break;
        
      case "GET_PERFORMANCE_INFO":
        sendResponse(getPerformanceMetrics());
        break;
        
      default:
        sendResponse({ error: "Unknown request type", type: request.type });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message, stack: error.stack });
  }
});