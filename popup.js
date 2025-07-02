// AI Tab Assistant Popup Script

let conversationHistory = [];
let isProcessing = false;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    });

    // Send message on Enter (but allow Shift+Enter for new lines)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Check API key on load
    checkApiKey();
});

// Check if API key is set
function checkApiKey() {
    chrome.storage.sync.get(['geminiApiKey'], (result) => {
        if (!result.geminiApiKey) {
            addMessage('assistant', '⚠️ API key not found. Please set your Gemini API key in the extension options first.');
        }
    });
}

// Send quick message from buttons
function sendQuickMessage(message) {
    const userInput = document.getElementById('user-input');
    userInput.value = message;
    sendMessage();
}

// Send message
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    
    if (!message || isProcessing) return;

    // Add user message
    addMessage('user', message);
    userInput.value = '';
    userInput.style.height = 'auto';

    // Show loading
    const loadingId = addMessage('assistant', '', true);
    isProcessing = true;
    document.getElementById('send-btn').disabled = true;

    try {
        const response = await processMessage(message);
        removeMessage(loadingId);
        addMessage('assistant', response);
    } catch (error) {
        removeMessage(loadingId);
        addMessage('assistant', `❌ Error: ${error.message}`);
    } finally {
        isProcessing = false;
        document.getElementById('send-btn').disabled = false;
    }
}

// Process the user's message
async function processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check what the user is asking for
    if (lowerMessage.includes('screenshot')) {
        return await handleScreenshot(message);
    } else if (lowerMessage.includes('describe') || lowerMessage.includes('what is') || lowerMessage.includes('about this page')) {
        return await handlePageDescription(message);
    } else if (lowerMessage.includes('test case') || lowerMessage.includes('testing')) {
        return await handleTestCases(message);
    } else if (lowerMessage.includes('documentation') || lowerMessage.includes('document')) {
        return await handleDocumentation(message);
    } else {
        // General AI chat about the page
        return await handleGeneralChat(message);
    }
}

// Handle screenshot request
async function handleScreenshot(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({action: 'captureScreenshot'}, (response) => {
            if (response.error) {
                resolve(`❌ Could not capture screenshot: ${response.error}`);
            } else {
                // Add screenshot to the conversation
                const screenshotDiv = document.createElement('div');
                screenshotDiv.className = 'screenshot-container';
                screenshotDiv.innerHTML = `<img src="${response.screenshot}" alt="Page Screenshot">`;
                
                const messagesContainer = document.getElementById('messages');
                const lastMessage = messagesContainer.lastElementChild;
                if (lastMessage && lastMessage.classList.contains('assistant')) {
                    lastMessage.querySelector('.message-bubble').appendChild(screenshotDiv);
                }
                
                resolve('📸 Here is a screenshot of the current page. What would you like me to analyze about it?');
            }
        });
    });
}

// Handle page description
async function handlePageDescription(message) {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, {type: 'GET_FULL_PAGE_INFO'}, async (response) => {
                if (!response || response.error) {
                    resolve('❌ Could not analyze this page. The page might not be fully loaded or accessible.');
                    return;
                }

                const pageInfo = response;
                const prompt = `Please describe this webpage based on the following information:

Title: ${pageInfo.metadata.title}
URL: ${pageInfo.metadata.url}
Description: ${pageInfo.metadata.description}

Page Structure:
- ${pageInfo.structure.headings.length} headings
- ${pageInfo.structure.links.length} links  
- ${pageInfo.structure.images.length} images
- ${pageInfo.structure.forms.length} forms

Main headings:
${pageInfo.structure.headings.slice(0, 5).map(h => `${h.level.toUpperCase()}: ${h.text}`).join('\n')}

Content preview:
${pageInfo.text.substring(0, 500)}...

Please provide a comprehensive description of what this page is about, its purpose, and main content.`;

                try {
                    const aiResponse = await callGeminiAPI(prompt);
                    resolve(aiResponse);
                } catch (error) {
                    resolve(`❌ Error generating description: ${error.message}`);
                }
            });
        });
    });
}

// Handle test cases generation
async function handleTestCases(message) {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, {type: 'GET_TESTABLE_ELEMENTS'}, async (response) => {
                if (!response || response.error) {
                    resolve('❌ Could not analyze testable elements on this page.');
                    return;
                }

                const elements = response;
                const prompt = `Based on the following webpage elements, create comprehensive test cases:

BUTTONS (${elements.buttons.length}):
${elements.buttons.map(btn => `- ${btn.text || 'Unnamed button'} (ID: ${btn.id || 'none'})`).join('\n')}

INPUT FIELDS (${elements.inputs.length}):
${elements.inputs.map(input => `- ${input.inputType} field: ${input.name || input.placeholder || 'Unnamed'} ${input.required ? '(Required)' : ''}`).join('\n')}

CLICKABLE ELEMENTS (${elements.clickableElements.length}):
${elements.clickableElements.slice(0, 10).map(el => `- ${el.text.substring(0, 50)} (${el.type})`).join('\n')}

Please create detailed test cases including:
1. Functional tests for buttons and forms
2. Navigation tests for links
3. Input validation tests
4. User interaction tests
5. Edge cases and error scenarios

Format the response as organized test cases with clear steps.`;

                try {
                    const aiResponse = await callGeminiAPI(prompt);
                    resolve(aiResponse);
                } catch (error) {
                    resolve(`❌ Error generating test cases: ${error.message}`);
                }
            });
        });
    });
}

// Handle documentation generation
async function handleDocumentation(message) {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, {type: 'GET_FULL_PAGE_INFO'}, async (response) => {
                if (!response || response.error) {
                    resolve('❌ Could not analyze this page for documentation.');
                    return;
                }

                const pageInfo = response;
                const prompt = `Create comprehensive technical documentation for this webpage:

PAGE INFORMATION:
- Title: ${pageInfo.metadata.title}
- URL: ${pageInfo.metadata.url}
- Description: ${pageInfo.metadata.description}

STRUCTURE ANALYSIS:
- Headings: ${pageInfo.structure.headings.length}
- Links: ${pageInfo.structure.links.length}
- Images: ${pageInfo.structure.images.length}
- Forms: ${pageInfo.structure.forms.length}

HEADINGS HIERARCHY:
${pageInfo.structure.headings.map(h => `${h.level.toUpperCase()}: ${h.text}`).join('\n')}

FORMS DETECTED:
${pageInfo.structure.forms.map(form => 
    `Form (${form.method.toUpperCase()}): ${form.inputs.length} inputs`
).join('\n')}

CONTENT PREVIEW:
${pageInfo.text.substring(0, 800)}...

Please create documentation that includes:
1. Page Overview and Purpose
2. Navigation Structure
3. Key Features and Functionality
4. Forms and User Interactions
5. Technical Specifications
6. User Guide/Instructions

Format as clear, professional documentation.`;

                try {
                    const aiResponse = await callGeminiAPI(prompt);
                    resolve(aiResponse);
                } catch (error) {
                    resolve(`❌ Error generating documentation: ${error.message}`);
                }
            });
        });
    });
}

// Handle general chat
async function handleGeneralChat(message) {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
            chrome.tabs.sendMessage(tab.id, {type: 'GET_FULL_PAGE_INFO'}, async (response) => {
                const contextPrompt = response && !response.error ? `
Context about the current webpage:
- Title: ${response.metadata.title}
- URL: ${response.metadata.url}
- Content preview: ${response.text.substring(0, 300)}...

User's question: ${message}

Please answer the user's question in the context of this webpage.` : 
                `User's question: ${message}

Note: I couldn't access information about the current webpage, so I'll answer based on general knowledge.`;

                try {
                    const aiResponse = await callGeminiAPI(contextPrompt);
                    resolve(aiResponse);
                } catch (error) {
                    resolve(`❌ Error: ${error.message}`);
                }
            });
        });
    });
}

// Call Gemini API
async function callGeminiAPI(prompt) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['geminiApiKey'], async (result) => {
            if (!result.geminiApiKey) {
                reject(new Error('API key not found. Please set your API key in the extension options.'));
                return;
            }

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${result.geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.7 }
                        })
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'API request failed');
                }

                const data = await response.json();
                const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response available.';
                resolve(aiResponse);
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Add message to chat
function addMessage(sender, content, isLoading = false) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    const messageId = Date.now() + Math.random();
    
    messageDiv.className = `message ${sender}`;
    messageDiv.dataset.messageId = messageId;
    
    if (isLoading) {
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <div class="loading">
                    <span>Thinking</span>
                    <div class="loading-dots">
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                        <div class="loading-dot"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `<div class="message-bubble">${formatMessage(content)}</div>`;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    return messageId;
}

// Remove message by ID
function removeMessage(messageId) {
    const message = document.querySelector(`[data-message-id="${messageId}"]`);
    if (message) {
        message.remove();
    }
}

// Format message content
function formatMessage(content) {
    // Convert newlines to HTML breaks
    content = content.replace(/\n/g, '<br>');
    
    // Format code blocks (basic)
    content = content.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    
    // Format inline code
    content = content.replace(/`([^`]+)`/g, '<code style="background: #f1f3f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
    
    return content;
}