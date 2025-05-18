# Browser Helper Scripts

This repository contains a collection of small user scripts intended for Tampermonkey (or similar extensions) plus a simple HTML page listing some tools. Each script is stored at the repository root.

## Scripts

| Script | Description |
| --- | --- |
| `chatgptclear.user.js` | Adds a button to quickly clear the ChatGPT text area. |
| `chatgptfingercopy.user.js` | Lets you swipe left to right to copy selected text into the ChatGPT input box. |
| `x.user.js` | Removes the first two Twitter/X tabs and focuses the third. |
| `xipad.user.js` | Same as `x.user.js` but adjusted for iPad layout. |
| `xbutton.user.js` | Adds custom buttons that send tweet information to an external endpoint. |
| `xto.user.js` | Expands `t.co` short links to their original targets. |
| `notebooklmspeed.user.js` | Sets NotebookLM playback to 1.8× speed automatically. |
| `tools.html` | Static page with links to assorted AI tools. |

## Notes

- **Permissions**: Some scripts request permissions such as `GM_xmlhttpRequest` for cross-origin requests.
- **DOM Manipulation**: Scripts rely heavily on DOM APIs (`querySelector`, event listeners, etc.).
- **Manual Testing**: There is no automated test suite; install the scripts in your browser to test their behavior.

