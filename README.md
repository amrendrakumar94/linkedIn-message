# LinkedIn Message Copilot

This project supports **both modes**:

1. **Hosted web page mode** (e.g., GitHub Pages) for direct browser usage.
2. **Chrome extension mode** popup usage from **any active tab**.

## What it does

- Generates a polished referral message from your inputs.
- Optionally shortens your resume URL using TinyURL.
- Copies the generated message to clipboard.
- Auto-saves your draft fields and last output so it stays available after switching tabs.
- Includes a **Clear Draft** action to reset fields/output when needed.

## Mode 1: Hosted web page (GitHub Pages)

- Use `index.html` for the full web app experience.
- `popup.html` + `popup.js` also run in a regular browser context (web mode fallback).

## Mode 2: Chrome extension (developer mode)

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this folder: `linkedIn-message`.
5. Pin and open the extension from any tab.

## Behavior

- The extension does not block usage based on current tab URL.
- You can generate and copy the message from any tab.
- Draft state is persisted continuously, so reopening the popup after tab switching restores your values/output.
- In web mode (non-extension), it works as a normal message generator page.
