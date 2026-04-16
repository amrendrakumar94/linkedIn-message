# LinkedIn Message Copilot

This project now supports **both modes**:

1. **Hosted web page mode** (e.g., GitHub Pages) for direct browser usage.
2. **Chrome extension mode** for popup usage while a LinkedIn tab is open.

## What it does

- Generates a polished referral message from your inputs.
- Optionally shortens your resume URL using TinyURL.
- Copies the generated message to clipboard.
- Saves your last-used form values.

## Mode 1: Hosted web page (GitHub Pages)

- Use `index.html` for the full web app experience.
- `popup.html` + `popup.js` also now run in a regular browser context (web mode fallback).

## Mode 2: Chrome extension (developer mode)

1. Open `chrome://extensions` in Google Chrome.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this folder: `linkedIn-message`.
5. Pin the extension and open it while you're on a LinkedIn tab.

## Extension-specific behavior

- When running as an extension popup, it checks the active tab and enables generation only on `linkedin.com` tabs.
- In web mode (non-extension), LinkedIn-tab checks are skipped and it works as a normal message generator page.
