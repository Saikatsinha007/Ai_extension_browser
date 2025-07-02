# 🧩 AI Page Assistant Chrome Extension

https://github.com/user-attachments/assets/69101dbb-ab6f-491b-b200-f252d69addec




**AI Page Assistant** is a browser extension that lets you interact with any web page using Generative AI.
Use it to:
✅ Take a screenshot of the current tab
✅ Describe the page contents
✅ Identify test cases for QA
✅ Generate documentation outlines
✅ Ask any custom question about the page

Powered by **Google Gemini API** (you add your own API key).

---

## 🚀 Features

* 📸 **Take Screenshot:** Captures the visible area of the current tab.
* 🗂️ **Describe Page:** Extracts page structure, headings, links, and key info.
* ✅ **Identify Test Cases:** Uses Gen AI to suggest potential test cases.
* 📚 **Generate Docs:** Creates draft documentation for the current page.
* 💬 **Chat with Page:** Ask any custom question about the current page’s content.

---

## 🔑 Requirements

* Chrome browser
* Your own **Gemini API key** — get it from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 📦 Installation

1. Clone or download this repo to your local machine.
2. Open **Chrome** → `chrome://extensions`
3. Enable **Developer mode** (top right).
4. Click **“Load unpacked”** and select the extension folder.
5. On first install, you’ll be prompted to enter your Gemini API key in the Options page.

---

## ⚙️ Usage

1. Click the extension icon in your Chrome toolbar.
2. Use the buttons:

   * **Take Screenshot** → Captures a snapshot.
   * **Describe Page** → Generates a detailed description.
   * **Identify Test Cases** → Lists potential tests.
   * **Generate Docs** → Creates a draft page documentation.
   * **Ask** → Type any custom question in the chat box.
3. View AI-generated results directly in the popup.
4. Copy results as needed.

---

## 🗃️ Project Structure

```
ai-page-assistant/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── options.html
├── options.js
└── icon.png
```

---

## 🔐 API Key Management

* Your Gemini API key is securely stored using Chrome’s `storage.sync`.
* You can update your API key anytime via the extension’s **Options** page.

---

## 📝 How It Works

* `content.js` extracts page data like headings, links, and text.
* `popup.js` handles UI actions and sends data to Google Gemini.
* `background.js` ensures users add their API key on first install.

---

## ⚡ Tips

* This extension works best on pages with clear structure and meaningful content.
* Screenshots are saved as data URLs inside the popup — download manually if needed.
* The extension does not send your API key anywhere except to Google Gemini’s endpoint.

---

## 📄 License

MIT — free to use and modify
