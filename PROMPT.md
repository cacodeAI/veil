# Build: veil - Stealth Browser CLI

Build a stealth headless browser CLI tool called "veil" for AI agents.

## Overview
A Node.js CLI tool that wraps Playwright with stealth anti-detection. Designed for AI agents to control web browsers and bypass bot detection (X/Twitter, Reddit, etc).

## Tech Stack
- Node.js + TypeScript
- playwright + playwright-extra + puppeteer-extra-plugin-stealth
- commander for CLI
- chalk + ora for terminal output
- encrypted JSON for session storage (~/.veil/sessions/)

## CLI Commands
```
veil login <platform>              # opens visible browser for manual login, saves session
veil logout <platform>             # clear saved session
veil navigate <url>                # navigate to URL (headless)
veil act "<natural instruction>"   # perform action on current page
veil extract "<query>"             # extract data from page, output JSON
veil screenshot [--output path]    # take screenshot
veil session list                  # list saved sessions/platforms
veil status                        # show browser + session status
```

## Key Features
1. Two modes: interactive (visible browser for auth) vs headless agent mode (stealth)
2. Session persistence: save cookies/storage to ~/.veil/sessions/<platform>.json
3. Stealth: playwright-extra with stealth plugin, human-like delays, proper headers
4. JSON output: all commands output clean JSON for agent consumption (--json flag)
5. Platform awareness: detect platform from URL or explicit name
6. --headed flag on any command to force visible browser

## Project Structure
```
veil/
  src/
    index.ts          # CLI entry point
    browser.ts        # Playwright browser manager (stealth setup)
    session.ts        # Session save/load
    commands/
      login.ts
      navigate.ts
      act.ts
      extract.ts
      screenshot.ts
      session.ts
  package.json
  tsconfig.json
  README.md
```

## package.json requirements
- name: "veil"
- bin: { "veil": "./dist/index.js" }
- scripts: build, dev, start
- All deps listed correctly

## Important Details
- `veil login twitter` should: launch visible Chromium, wait for user to complete login manually (detect when they reach twitter.com/home), then save the session automatically
- `veil act` accepts natural language and translates to Playwright actions using simple heuristics
- Make it fully working and buildable with: npm install && npm run build
- README should be clean and GitHub-quality

When completely finished, run: openclaw system event --text "Done: veil browser CLI built" --mode now
