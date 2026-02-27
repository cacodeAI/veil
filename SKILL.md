# veil — OpenClaw Stealth Browser Remote

## What is veil

veil is a **headless browser remote control** for OpenClaw. It runs a persistent stealth Chromium browser and exposes it through a clean CLI. You (OpenClaw) are the brain — veil is just the hands.

Every command outputs clean JSON: `{ ok: true, ... }` or `{ ok: false, error: "..." }`

## Installation

```bash
npm install -g veil-browser
npx playwright install chromium
```

## Core Mental Model

You chain veil commands like a human would:
1. Open the browser to the right platform (`veil open x`)
2. Read the page (`veil snapshot` or `veil read`)
3. Act on what you see (`veil click`, `veil type`)
4. Verify the result (`veil find`, `veil read`, `veil shot`)

---

## Full Command Reference

### Session Setup (do once)
```bash
veil login x              # Opens visible browser → log in → saves cookies
veil login linkedin
veil login reddit
veil sessions             # List saved sessions
```

### Open a Session
```bash
veil open x               # Restore X session, navigate to home feed
veil open linkedin        # Restore LinkedIn session
veil open <platform>      # Any saved platform
```

### Navigation
```bash
veil go https://x.com/home           # Navigate to URL
veil go https://x.com --wait load    # Wait for full load
veil url                              # Get current URL + title
veil back                             # Go back
```

### Reading the Page
```bash
veil snapshot             # DOM/ARIA tree — use this to understand page structure
veil snapshot --max 4000  # Smaller snapshot for faster processing
veil read                 # Full page text (first 5000 chars)
veil read "[data-testid='tweetText']"          # Text of first match
veil read "[data-testid='tweetText']" --all    # All matches as array
veil read "a" --attr href                       # Read attribute
veil find "Sign in"       # Check if text exists: { ok: true, found: true }
veil exists "[data-testid='like']"  # Check if selector exists
```

### Clicking
```bash
veil click "[data-testid='like']"             # Click first match
veil click "[data-testid='like']" --nth 2     # Click 3rd match (0-indexed)
veil click "[data-testid='like']" --force     # Force click (bypass overlays)
veil click "[data-testid='reply']" --timeout 8000
```

### Typing
```bash
veil type "[data-testid='tweetTextarea_0']" "Hello world"
veil type "input[name='search']" "AI architecture" --clear   # Clear first
veil type "[data-testid='tweetTextarea_0']" "text" --delay 60 # Slower, more human
```

### Keyboard
```bash
veil press Enter
veil press Tab
veil press Escape
veil press ArrowDown
```

### Scrolling
```bash
veil scroll down           # Scroll 600px down
veil scroll up             # Scroll 600px up
veil scroll down --amount 1200
veil scroll top            # Jump to top of page
veil scroll bottom         # Jump to bottom
```

### Timing
```bash
veil wait 500              # Wait 500ms
veil wait 2000             # Wait 2 seconds
veil wait-for "[data-testid='timeline']"            # Wait until element appears
veil wait-for "[data-testid='timeline']" --timeout 15000
```

### Screenshots
```bash
veil shot                        # Screenshot to veil-<timestamp>.png
veil shot page.png               # Custom filename
veil shot page.png --full        # Full page
veil shot el.png --selector "[data-testid='tweet']"  # Screenshot element
```

### JavaScript Execution
```bash
veil eval "document.title"
veil eval "window.scrollY"
veil eval "document.querySelectorAll('article').length"
```

### Close Browser
```bash
veil close                 # Close current browser
```

---

## Platform Selectors

### X (Twitter) — x.com

| Element | Selector |
|---------|----------|
| Tweet text area | `[data-testid="tweetTextarea_0"]` |
| Post/Tweet button | `[data-testid="tweetButtonInline"]` |
| Like button | `[data-testid="like"]` |
| Unlike (already liked) | `[data-testid="unlike"]` |
| Reply button | `[data-testid="reply"]` |
| Retweet button | `[data-testid="retweet"]` |
| Share/More options | `[aria-label="Share Tweet"]` |
| A tweet (article) | `article[data-testid="tweet"]` |
| First tweet | `article[data-testid="tweet"]:first-of-type` |
| Tweet text content | `[data-testid="tweetText"]` |
| Feed timeline | `[data-testid="primaryColumn"]` |
| Search box | `[data-testid="SearchBox_Search_Input"]` |
| Menu items | `[role="menuitem"]` |
| Follow button | `[data-testid="follow"]` |

### LinkedIn — linkedin.com

| Element | Selector |
|---------|----------|
| Like button | `button[aria-label*="Like"]` |
| Comment button | `button[aria-label*="Comment"]` |
| Share button | `button[aria-label*="Share"]` |
| Comment text area | `[contenteditable="true"][role="textbox"]` |
| Post button | `button.comments-comment-box__submit-button` |
| Feed posts | `.feed-shared-update-v2` |

### Reddit — reddit.com

| Element | Selector |
|---------|----------|
| Upvote button | `button[aria-label="upvote"]` |
| Comment link | `a[data-click-id="comments"]` |
| Comment box | `[contenteditable="true"]` |
| Submit comment | `button:has-text("Comment")` |

---

## Common Task Sequences

### Post a Tweet on X
```bash
veil open x
veil wait-for "[data-testid='primaryColumn']"
veil click "[data-testid='tweetTextarea_0']"
veil wait 300
veil type "[data-testid='tweetTextarea_0']" "Your tweet text here"
veil wait 500
veil click "[data-testid='tweetButtonInline']" --force
veil wait 1500
veil find "Your tweet text here"
```

### Like First 5 Posts on X Feed
```bash
veil open x
veil wait-for "article[data-testid='tweet']"
veil click "[data-testid='like']" --nth 0
veil wait 800
veil click "[data-testid='like']" --nth 1
veil wait 800
veil click "[data-testid='like']" --nth 2
veil wait 800
veil click "[data-testid='like']" --nth 3
veil wait 800
veil click "[data-testid='like']" --nth 4
veil wait 800
```

### Reply to First Post on X Feed
```bash
veil open x
veil wait-for "article[data-testid='tweet']"
veil click "[data-testid='reply']" --nth 0 --force
veil wait 600
veil click "[data-testid='tweetTextarea_0']"
veil wait 200
veil type "[data-testid='tweetTextarea_0']" "Great post! This is exactly why AI needs structured reasoning."
veil wait 400
veil click "[data-testid='tweetButton']" --force
veil wait 1500
```

### Search X for AI Posts
```bash
veil open x
veil go https://x.com/search?q=AI+architecture&f=live
veil wait-for "article[data-testid='tweet']"
veil snapshot --max 3000
# Now you can see the results and decide which to interact with
```

### Read Feed Before Interacting
```bash
veil open x
veil wait-for "article[data-testid='tweet']"
veil read "[data-testid='tweetText']" --all
# Returns JSON array of tweet texts — you can decide which to reply to
```

---

## Error Handling

Every command returns JSON. Always check `ok`:

```bash
result=$(veil click "[data-testid='like']")
# Check: echo $result | jq .ok
# If false: echo $result | jq .error
```

**Common errors and fixes:**

| Error | Fix |
|-------|-----|
| `No browser open` | Run `veil open x` first |
| `Timeout waiting for selector` | Page not loaded yet — add `veil wait 2000` before |
| `Element not found` | Use `veil snapshot` to inspect actual DOM, adjust selector |
| `Session not found` | Run `veil login x` to create session |
| Click fails (overlay) | Add `--force` flag to `veil click` |

**Debug workflow:**
```bash
veil shot debug.png          # What does the page actually look like?
veil snapshot --max 5000     # What's in the DOM?
veil exists "[selector]"     # Does the element even exist?
```

---

## Session Persistence

- Sessions stored in `~/.veil/sessions/<platform>.json` (encrypted cookies)
- Browser instance stays open within a single execution chain
- Each new `veil` command that needs the browser checks for existing session
- Use `veil close` to explicitly close the browser

---

## Notes

- All clicks on X use `--force` by default to bypass overlay interceptors
- Human-like delays are added automatically between interactions
- FlareSolverr auto-starts via Docker if Cloudflare challenges are detected
- veil outputs only JSON to stdout — safe to pipe and parse
