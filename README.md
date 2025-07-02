# ChatGPT Folder Organizer

A Chrome extension that adds folder organization to ChatGPT's conversation history, making it easier to manage and find your conversations.

## Features

- **Folder Management**: Create, rename, and delete custom folders
- **Conversation Organization**: Move conversations into folders using an intuitive interface
- **Visual Organization**: Clear folder structure with conversation counts
- **Organize Mode**: Toggle mode to easily select and move multiple conversations
- **Data Persistence**: All organization is saved locally using Chrome's storage API
- **Export/Import**: Backup and restore your folder organization
- **Dark Mode Support**: Automatically adapts to your system's theme preference

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Navigate to ChatGPT (chat.openai.com or chatgpt.com)
6. The folder organizer will appear at the top of your conversation history

## Usage

### Creating Folders
1. Click the "+" button in the folder panel
2. Enter a name for your new folder
3. The folder will appear in your folder list

### Renaming Folders
1. Click the **✎** button next to a folder name
2. Enter a new name when prompted
3. The folder list will update with the new name

### Organizing Conversations
1. Click "Organize Conversations" to enter organize mode
2. Click on conversations you want to move (they'll be highlighted)
3. A modal will appear showing available folders
4. Select the destination folder
5. Click "Exit Organize Mode" when done

### Filtering by Folder
- Click on any folder to show only conversations in that folder
- The "Unorganized" folder shows conversations not assigned to any folder
- Folder names show the number of conversations they contain

### Managing Data
- Use the extension popup (click the extension icon) to:
  - View statistics about your organization
  - Export your folder data as JSON
  - Import previously exported data
  - Refresh the extension if needed

## Technical Details

### Files Structure
- `manifest.json` - Extension configuration
- `content.js` - Main functionality injected into ChatGPT
- `styles.css` - Styling for the folder interface
- `popup.html/js` - Extension popup for management
- `icons/` - Extension icons (16px, 48px, 128px)

### Data Storage
- Uses Chrome's `storage.local` API
- Stores folder definitions and conversation-to-folder mappings
- Data persists across browser sessions
- No external servers or data collection

### Browser Compatibility
- Chrome/Chromium-based browsers
- Requires Manifest V3 support
- Works with both chat.openai.com and chatgpt.com

## Development

To modify or extend the extension:

1. Edit the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the ChatGPT page to see changes

## Privacy

This extension:
- Stores all data locally in your browser
- Does not send any data to external servers
- Only accesses ChatGPT pages as specified in the manifest
- Does not track or collect user behavior

## Support

For issues or feature requests, please check the conversation history where you discussed this extension's development.

## Version History

- v1.0.0 - Initial release with core folder organization features