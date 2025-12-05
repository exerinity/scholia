#  why.txt
A basic PWA notepad built in JS

## Stuff it has
- Multi-note list with new, duplicate, and delete buttons
- Search filter across titles and note text
- Last edit time and character count in the sidebar
- Autosaves to local storage and restores your last note
- Installable PWA with service worker caching so it works offline
- Rich text toolbar; fonts, sizes, bold/italic/underline/strike, lists, indent/outdent, alignments, clear, undo/redo
- Tracks word count
- Light/dark theme toggle
- Online/offline status tag (no idea why, but why not)
- Keyboard shortcuts for note actions and search
- Mobile-friendly navigation drawer
- Lightweight and fluid
- Export current note as a standalone .html file

## Install
### As a normal app (PWA):
- Visit https://why.exerinity.com
- Press "Install" in the top left corner (or from the hamburger menu on mobile). If you do not see it, it's probably already installed or your browser does not support PWAs. In that case, the app should already be installed in your browser, just visit it any time.

### From source:
- Download or clone this repository
- Start a local server in the root directory and visit it in your browser

## License
This project is licensed under the MIT license. See the [license](license) file for details.

## Hotkeys
| Action          | Shortcut            |
|-----------------|---------------------|
| New note        | `Alt + N` *(or `Insert`)*  |
| Delete note     | `Alt + Delete`             |
| Focus search    | `Alt + S` *(or `Ctrl/⌘ + K`)* |
| Rename note     | `Alt + Y`                  |
| Undo / Redo     | `Ctrl/⌘ + Z / Y`     |
| Bold / Italic   | `Ctrl/⌘ + B / I`     |
| Underline       | `Ctrl/⌘ + U`         |

***HOWEVER***, since this is literally a web app, things can interfere and take precedence over these hotkeys, such as browser extensions, OS shortcuts, manufacturer software, etc.

## Release notes
See this file: [RELNOTE.md](RELNOTE.md)
