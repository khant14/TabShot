# TabShot Chrome Extension

A Chrome extension for capturing and managing browser tabs.

## Features

- Capture current tab information
- View list of captured tabs
- Store tab information locally

## Installation

1. Clone this repository or download the files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Development

The extension consists of the following files:

- `manifest.json`: Extension configuration
- `popup.html`: Popup UI structure
- `styles/popup.css`: Styling for the popup
- `scripts/popup.js`: Popup functionality

### File Structure

```
tabshot/
├── manifest.json
├── popup.html
├── styles/
│   └── popup.css
├── scripts/
│   └── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Usage

1. Click the extension icon in your Chrome toolbar
2. Click "Capture Current Tab" to save the current tab's information
3. View your captured tabs in the list below

## Permissions

- `tabs`: Access to tab information
- `activeTab`: Access to the current active tab
- `storage`: Store tab data locally

## Contributing

Feel free to submit issues and enhancement requests! 

zip -r tabshot.zip manifest.json popup.html icons/ scripts/ styles/ -x "*.DS_Store" "node_modules/*" "*.git*"