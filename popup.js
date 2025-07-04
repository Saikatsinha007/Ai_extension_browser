// AI Tab Assistant Pro - Powered by Gemini Flash 2.0

let conversationHistory = [];
let isProcessing = false;
let currentTab = null;

// Initialize the popup
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 80) + 'px';
    });

    // Send message on Enter (but allow Shift+Enter for new lines)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Initialize app
    initializeApp();
});

// Initialize the application
async function initializeApp() {
    try {
        // Get current tab info
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        currentTab = tabs[0];
        
        // Check API key
        await checkApiKey();
        
        // Update status indicator
        updateStatusIndicator('connected');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        updateStatusIndicator('error');
    }
}

// Update status indicator
function updateStatusIndicator(status) {
    const indicator = document.querySelector('.status-indicator');
    const colors = {
        connected: '#48bb78',
        processing: '#ed8936', 
        error: '#f56565',
        disconnected: '#718096'
    };
    indicator.style.background = colors[status] || colors.disconnected;
}

// Check if API key is set
async function checkApiKey() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (!result.geminiApiKey) {
                addMessage('assistant', '⚠️ **Setup Required**\n\nPlease configure your Gemini API key in the extension options to start using AI features.\n\n[Get your API key from Google AI Studio](https://makersuite.google.com/app/apikey)');
                updateStatusIndicator('error');
                resolve(false);
            } else {
                updateStatusIndicator('connected');
                resolve(true);
            }
        });
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

    // Check API key first
    const hasApiKey = await checkApiKey();
    if (!hasApiKey) return;

    // Add user message
    addMessage('user', message);
    userInput.value = '';
    userInput.style.height = 'auto';

    // Update conversation history
    conversationHistory.push({role: 'user', content: message});

    // Show loading
    const loadingId = addMessage('assistant', '', true);
    isProcessing = true;
    updateStatusIndicator('processing');
    document.getElementById('send-btn').disabled = true;

    try {
        const response = await processMessage(message);
        removeMessage(loadingId);
        addMessage('assistant', response);
        
        // Add to conversation history
        conversationHistory.push({role: 'assistant', content: response});
        
        // Keep conversation history manageable
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-16);
        }
        
        updateStatusIndicator('connected');
    } catch (error) {
        removeMessage(loadingId);
        addMessage('assistant', `❌ **Error Processing Request**\n\n${error.message}\n\nPlease try again or check your API key configuration.`);
        updateStatusIndicator('error');
        console.error('Processing error:', error);
    } finally {
        isProcessing = false;
        document.getElementById('send-btn').disabled = false;
    }
}

// Process the user's message with enhanced AI capabilities
async function processMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Determine the type of request
    if (lowerMessage.includes('screenshot')) {
        return await handleScreenshot(message);
    } else if (lowerMessage.includes('describe') || lowerMessage.includes('analyze') || lowerMessage.includes('what is') || lowerMessage.includes('about this page')) {
        return await handlePageAnalysis(message);
    } else if (lowerMessage.includes('test case') || lowerMessage.includes('testing') || lowerMessage.includes('qa')) {
        return await handleTestCases(message);
    } else if (lowerMessage.includes('documentation') || lowerMessage.includes('document') || lowerMessage.includes('docs')) {
        return await handleDocumentation(message);
    } else {
        // Enhanced general chat with context awareness
        return await handleIntelligentChat(message);
    }
}

// Enhanced screenshot handling with AI analysis
async function handleScreenshot(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({action: 'captureScreenshot'}, async (response) => {
            if (response.error) {
                resolve(`❌ **Screenshot Error**\n\nCould not capture screenshot: ${response.error}\n\nPlease ensure the page is fully loaded and try again.`);
                return;
            }

            try {
                // Add screenshot to the conversation
                const screenshotDiv = document.createElement('div');
                screenshotDiv.className = 'screenshot-container';
                screenshotDiv.innerHTML = `<img src="${response.screenshot}" alt="Page Screenshot" style="border: 2px solid #e2e8f0; border-radius: 8px;">`;
                
                // Insert screenshot into the most recent message
                setTimeout(() => {
                    const messagesContainer = document.getElementById('messages');
                    const lastMessage = messagesContainer.lastElementChild;
                    if (lastMessage && lastMessage.classList.contains('assistant')) {
                        const bubble = lastMessage.querySelector('.message-bubble');
                        bubble.appendChild(screenshotDiv);
                    }
                }, 100);

                // Get page context for AI analysis
                const pageContext = await getPageContext();
                
                const analysisPrompt = `📸 **Screenshot Analysis Request**

I've captured a screenshot of the current webpage. Here's the context:

**Page Information:**
- Title: ${pageContext.metadata.title}
- URL: ${pageContext.metadata.url}
- Page Type: ${determinePageType(pageContext)}

**User Request:** ${message}

Please analyze this screenshot and webpage context to provide:
1. Visual description of what's shown
2. Key UI elements and their purposes  
3. User experience observations
4. Notable design patterns or issues
5. Suggestions for improvement (if applicable)

Provide a professional, detailed analysis.`;

                const aiResponse = await callGeminiFlash2(analysisPrompt);
                resolve(`📸 **Screenshot Captured & Analyzed**\n\n${aiResponse}`);
                
            } catch (error) {
                resolve(`📸 Screenshot captured successfully!\n\n*AI analysis unavailable: ${error.message}*`);
            }
        });
    });
}

// Enhanced page analysis with deeper insights
async function handlePageAnalysis(message) {
    try {
        const pageContext = await getPageContext();
        
        if (!pageContext || pageContext.error) {
            return '❌ **Analysis Error**\n\nCould not access page information. The page might be restricted or not fully loaded.';
        }

        const analysisPrompt = `🔍 **Comprehensive Page Analysis**

**Page Details:**
- Title: "${pageContext.metadata.title}"
- URL: ${pageContext.metadata.url}
- Description: ${pageContext.metadata.description || 'Not available'}
- Keywords: ${pageContext.metadata.keywords || 'Not specified'}

**Content Structure:**
- Headings: ${pageContext.structure.headings.length} (${pageContext.structure.headings.slice(0, 3).map(h => h.level.toUpperCase()).join(', ')})
- Links: ${pageContext.structure.links.length}
- Images: ${pageContext.structure.images.length}
- Forms: ${pageContext.structure.forms.length}

**Main Content Headings:**
${pageContext.structure.headings.slice(0, 8).map(h => `${h.level.toUpperCase()}: ${h.text}`).join('\n')}

**Content Preview:**
${pageContext.text.substring(0, 1000)}...

**User's Specific Request:** ${message}

Please provide a comprehensive analysis including:
1. **Purpose & Intent**: What this page aims to accomplish
2. **Content Quality**: Assessment of information depth and clarity
3. **Structure & Navigation**: How well organized the content is
4. **User Experience**: Ease of use and accessibility
5. **Technical Insights**: Notable features or technologies
6. **Recommendations**: Specific improvements or observations

Format as a professional analysis report.`;

        const aiResponse = await callGeminiFlash2(analysisPrompt);
        return aiResponse;

    } catch (error) {
        return `❌ **Analysis Failed**\n\nError: ${error.message}`;
    }
}

// Enhanced test case generation with multiple testing approaches
async function handleTestCases(message) {
    try {
        const testableElements = await getTestableElements();
        const pageContext = await getPageContext();
        
        if (!testableElements || testableElements.error) {
            return '❌ **Test Generation Error**\n\nCould not analyze testable elements on this page.';
        }

        const testPrompt = `🧪 **Professional Test Case Generation**

**Page Under Test:**
- Title: ${pageContext.metadata.title}
- URL: ${pageContext.metadata.url}
- Page Type: ${determinePageType(pageContext)}

**Interactive Elements Detected:**

**Buttons & Actions (${testableElements.buttons.length}):**
${testableElements.buttons.map(btn => `- "${btn.text || 'Unnamed'}" ${btn.id ? `(ID: ${btn.id})` : ''}`).join('\n')}

**Input Fields (${testableElements.inputs.length}):**
${testableElements.inputs.map(input => `- ${input.inputType} field: "${input.name || input.placeholder || 'Unnamed'}" ${input.required ? '(Required)' : '(Optional)'}`).join('\n')}

**Clickable Elements (${testableElements.clickableElements.length}):**
${testableElements.clickableElements.slice(0, 10).map(el => `- "${el.text.substring(0, 40)}..." (${el.type})`).join('\n')}

**Forms Detected (${pageContext.structure.forms.length}):**
${pageContext.structure.forms.map((form, i) => `Form ${i+1}: ${form.method.toUpperCase()} action with ${form.inputs.length} inputs`).join('\n')}

**User Request:** ${message}

Generate comprehensive test cases including:

**1. Functional Testing:**
- Core feature validation
- Input/output testing
- Form submission workflows

**2. User Interface Testing:**
- Button interactions
- Navigation flow
- Visual element validation

**3. Usability Testing:**
- User workflow scenarios
- Accessibility considerations
- Mobile responsiveness

**4. Edge Cases & Error Scenarios:**
- Invalid input handling
- Boundary conditions
- Error message validation

**5. Security Testing:**
- Input sanitization
- Authentication flows
- Data validation

Format as professional test cases with:
- Test Case ID
- Objective
- Prerequisites  
- Test Steps
- Expected Results
- Priority Level`;

        const aiResponse = await callGeminiFlash2(testPrompt);
        return aiResponse;

    } catch (error) {
        return `❌ **Test Generation Failed**\n\nError: ${error.message}`;
    }
}

// Enhanced documentation generation
async function handleDocumentation(message) {
    try {
        const pageContext = await getPageContext();
        
        if (!pageContext || pageContext.error) {
            return '❌ **Documentation Error**\n\nCould not analyze this page for documentation generation.';
        }

        const docPrompt = `📝 **Professional Documentation Generation**

**Page Information:**
- Title: "${pageContext.metadata.title}"
- URL: ${pageContext.metadata.url}
- Description: ${pageContext.metadata.description || 'Not provided'}
- Page Type: ${determinePageType(pageContext)}

**Content Structure Analysis:**
- Total Headings: ${pageContext.structure.headings.length}
- Navigation Links: ${pageContext.structure.links.length}
- Media Elements: ${pageContext.structure.images.length}
- Interactive Forms: ${pageContext.structure.forms.length}

**Heading Hierarchy:**
${pageContext.structure.headings.map(h => `${'  '.repeat(parseInt(h.level.charAt(1)) - 1)}${h.level.toUpperCase()}: ${h.text}`).join('\n')}

**Interactive Elements:**
${pageContext.structure.forms.map((form, i) => 
    `Form ${i+1} (${form.method.toUpperCase()}): ${form.inputs.length} inputs - ${form.inputs.map(inp => inp.type).join(', ')}`
).join('\n')}

**Content Summary:**
${pageContext.text.substring(0, 1200)}...

**User Request:** ${message}

Create comprehensive technical documentation including:

**1. Overview**
- Purpose and scope
- Target audience
- Key functionality

**2. Architecture & Structure**
- Page hierarchy
- Navigation flow
- Content organization

**3. Features & Functionality**
- Core features
- User interactions
- Form workflows

**4. Technical Specifications**
- Input requirements
- Data formats
- Integration points

**5. User Guide**
- Step-by-step instructions
- Common workflows
- Troubleshooting

**6. API/Integration Details** (if applicable)
- Endpoints
- Parameters
- Response formats

Format as professional technical documentation with clear sections and examples.`;

        const aiResponse = await callGeminiFlash2(docPrompt);
        return aiResponse;

    } catch (error) {
        return `❌ **Documentation Failed**\n\nError: ${error.message}`;
    }
}

// Enhanced intelligent chat with context awareness
async function handleIntelligentChat(message) {
    try {
        const pageContext = await getPageContext();
        
        // Build conversation context
        const conversationContext = conversationHistory.length > 0 
            ? `\n\n**Previous Conversation:**\n${conversationHistory.slice(-6).map(msg => `${msg.role}: ${msg.content.substring(0, 200)}...`).join('\n')}`
            : '';

        const contextPrompt = pageContext && !pageContext.error ? `
🤖 **AI Assistant Context**

**Current Webpage:**
- Title: "${pageContext.metadata.title}"
- URL: ${pageContext.metadata.url}
- Type: ${determinePageType(pageContext)}
- Content: ${pageContext.text.substring(0, 800)}...

**Page Structure:**
- ${pageContext.structure.headings.length} headings
- ${pageContext.structure.links.length} links  
- ${pageContext.structure.forms.length} forms
- ${pageContext.structure.images.length} images

${conversationContext}

**User's Question:** ${message}

As an AI assistant specialized in web analysis, please provide a helpful, detailed response that considers the current webpage context. Be specific and actionable in your advice.` : 

`🤖 **AI Assistant**

${conversationContext}

**User's Question:** ${message}

I don't have access to the current webpage information, but I'll provide the best assistance possible based on your question.`;

        const aiResponse = await callGeminiFlash2(contextPrompt);
        return aiResponse;

    } catch (error) {
        return `❌ **Assistant Error**\n\nI encountered an issue: ${error.message}\n\nPlease try rephrasing your question or check your connection.`;
    }
}

// Call Gemini Flash 2.0 API with enhanced error handling
async function callGeminiFlash2(prompt) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['geminiApiKey'], async (result) => {
            if (!result.geminiApiKey) {
                reject(new Error('API key not configured. Please set your Gemini API key in the extension options.'));
                return;
            }

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${result.geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'User-Agent': 'AI-Tab-Assistant-Pro/2.0'
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { 
                                temperature: 0.7,
                                maxOutputTokens: 4096,
                                topP: 0.8,
                                topK: 40
                            },
                            safetySettings: [
                                {
                                    category: "HARM_CATEGORY_HARASSMENT",
                                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                                },
                                {
                                    category: "HARM_CATEGORY_HATE_SPEECH", 
                                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                                }
                            ]
                        })
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                
                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('No response generated by AI. Please try a different question.');
                }

                const aiResponse = data.candidates[0]?.content?.parts?.[0]?.text;
                if (!aiResponse) {
                    throw new Error('Empty response from AI. Please try again.');
                }

                resolve(aiResponse);
                
            } catch (error) {
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    reject(new Error('Network error. Please check your internet connection.'));
                } else {
                    reject(error);
                }
            }
        });
    });
}

// Helper function to get comprehensive page context
async function getPageContext() {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(currentTab.id, {type: 'GET_FULL_PAGE_INFO'}, (response) => {
            resolve(response || {error: 'Could not access page information'});
        });
    });
}

// Helper function to get testable elements
async function getTestableElements() {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(currentTab.id, {type: 'GET_TESTABLE_ELEMENTS'}, (response) => {
            resolve(response || {error: 'Could not access testable elements'});
        });
    });
}

// Helper function to determine page type
function determinePageType(pageContext) {
    if (!pageContext) return 'Unknown';
    
    const url = pageContext.metadata.url.toLowerCase();
    const title = pageContext.metadata.title.toLowerCase();
    const hasForm = pageContext.structure.forms.length > 0;
    
    if (url.includes('github.com')) return 'GitHub Repository';
    if (url.includes('stackoverflow.com')) return 'Stack Overflow';
    if (url.includes('docs.') || title.includes('documentation')) return 'Documentation';
    if (url.includes('admin') || url.includes('dashboard')) return 'Admin/Dashboard';
    if (hasForm && (title.includes('login') || title.includes('sign'))) return 'Authentication Page';
    if (hasForm) return 'Form/Input Page';
    if (pageContext.structure.headings.length > 5) return 'Content/Article Page';
    if (url.includes('api.') || title.includes('api')) return 'API Documentation';
    
    return 'Web Page';
}

// Enhanced message management
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
                    <span>AI is thinking</span>
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
    if (welcomeMessage && !isLoading) {
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

// Enhanced message formatting with markdown support
function formatMessage(content) {
    // Convert markdown-style formatting
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    content = content.replace(/\n/g, '<br>');
    
    // Format code blocks
    content = content.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Format links
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #667eea; text-decoration: underline;">$1</a>');
    
    return content;
}