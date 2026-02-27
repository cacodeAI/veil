# X.com (Twitter) Interaction Guide

## Page Structure

The X.com feed has this DOM structure:
```
<div role="main">  <!-- Main feed container -->
  <div data-testid="primaryColumn">  <!-- Left column (feed) -->
    <article data-testid="tweet">  <!-- Individual tweet -->
      <!-- Tweet content here -->
      <div data-testid="tweetText">  <!-- Tweet text -->
      <button data-testid="like">  <!-- Like button (heart icon) -->
      <button data-testid="reply">  <!-- Reply button -->
      <button data-testid="retweet">  <!-- Retweet button -->
      <button aria-label="Share Tweet">  <!-- More options (retweet, quote, etc) -->
```

## Common Tasks

### 1. Like a Post
```json
[
  { "action": "click", "selector": "article[data-testid='tweet']:first-child [data-testid='like']", "description": "Like the first post in feed" }
]
```

### 2. Reply to a Post
```json
[
  { "action": "click", "selector": "article[data-testid='tweet']:first-child [data-testid='reply']", "description": "Click reply button on first post" },
  { "action": "wait", "ms": 500, "description": "Wait for reply modal to open" },
  { "action": "click", "selector": "[data-testid='tweetTextarea_0']", "description": "Focus reply text area" },
  { "action": "type", "selector": "[data-testid='tweetTextarea_0']", "text": "Great insight! I agree with this approach.", "description": "Type reply message" },
  { "action": "click", "selector": "[data-testid='tweetButton']", "description": "Click reply button" }
]
```

### 3. Quote Tweet
```json
[
  { "action": "click", "selector": "article[data-testid='tweet']:first-child [aria-label='Share Tweet']", "description": "Click more options button" },
  { "action": "wait", "ms": 300 },
  { "action": "click", "selector": "[role='menuitem'][aria-label*='Quote']", "description": "Click quote option" },
  { "action": "wait", "ms": 500 },
  { "action": "click", "selector": "[data-testid='tweetTextarea_0']", "description": "Click quote text area" },
  { "action": "type", "selector": "[data-testid='tweetTextarea_0']", "text": "This is a great point about AI architecture.", "description": "Type quote message" },
  { "action": "click", "selector": "[data-testid='tweetButtonInline']", "description": "Click post button" }
]
```

### 4. Post a New Tweet
```json
[
  { "action": "click", "selector": "[data-testid='tweetButtonInline']", "description": "Click reply/compose button" },
  { "action": "wait", "ms": 500 },
  { "action": "click", "selector": "[data-testid='tweetTextarea_0']", "description": "Click text area" },
  { "action": "type", "selector": "[data-testid='tweetTextarea_0']", "text": "Your tweet content here", "description": "Type tweet" },
  { "action": "click", "selector": "[data-testid='tweetButtonInline']", "description": "Click post button" }
]
```

### 5. Scroll Down Feed
```json
[
  { "action": "scroll", "direction": "down", "description": "Scroll down to load more tweets" },
  { "action": "wait", "ms": 1000, "description": "Wait for new tweets to load" }
]
```

## Key Selectors (MOST STABLE)

| Element | Selector | Notes |
|---------|----------|-------|
| Like button | `[data-testid='like']` | Inside article, first `like` is the button |
| Reply button | `[data-testid='reply']` | Inside article |
| Retweet button | `[data-testid='retweet']` | Inside article |
| Tweet text area | `[data-testid='tweetTextarea_0']` | Contenteditable div in compose modal |
| Post/Tweet button | `[data-testid='tweetButtonInline']` | Green button in compose area |
| Share/More options | `[aria-label='Share Tweet']` | Opens menu with quote, bookmark options |
| Menu items | `[role='menuitem']` | Use with aria-label filter for specific actions |
| Article (post) | `article[data-testid='tweet']` | Use `:first-child`, `:nth-child(n)` to target |

## Timing & Stability

- **Click to modal open**: 500ms wait minimum
- **Type to post**: 300ms pause before clicking post button
- **Scroll to load**: 1000ms wait for tweets to appear
- **Always wait after clicks that change UI**: Use `{ "action": "wait", "ms": 500 }`
- **Use force: true for clicks** to bypass overlay interceptors (handled automatically)

## Common Patterns

### Find specific content
**Don't use generic selectors.** Use:
- `:first-child` for the first post in feed
- `:nth-child(2)` for the 2nd post
- Scroll then act on specific posts

### Like/Reply/Interact Pattern
```json
[
  { "action": "click", "selector": "article[data-testid='tweet']:first-child [data-testid='like']" },
  { "action": "wait", "ms": 800 }
]
```

### Compose Pattern
```json
[
  { "action": "click", "selector": "[data-testid='tweetTextarea_0']" },
  { "action": "wait", "ms": 200 },
  { "action": "type", "selector": "[data-testid='tweetTextarea_0']", "text": "..." },
  { "action": "wait", "ms": 300 },
  { "action": "click", "selector": "[data-testid='tweetButtonInline']" }
]
```

## Things to AVOID

❌ Don't use generic selectors like `button` or `div`
❌ Don't assume modal is open immediately after click
❌ Don't try to type without clicking first
❌ Don't navigate to different pages — stay on feed
❌ Don't try to interact with posts that aren't visible (scroll first!)

## Things to DO

✅ Use `data-testid` selectors ALWAYS
✅ Add 500ms+ waits after clicks that trigger modals
✅ Describe what each action does in the `description` field
✅ Chain actions logically (click → wait → type → wait → click post)
✅ When looking for "posts about X", scroll and find existing posts, don't create new ones
