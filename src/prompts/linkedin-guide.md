# LinkedIn Interaction Guide

## Page Structure

```
<main>
  <div class="feed">
    <article>  <!-- Post container -->
      <div class="post__content">  <!-- Post text -->
      <button aria-label="Like">  <!-- Like button -->
      <button aria-label="Comment">  <!-- Comment button -->
      <button aria-label="Share">  <!-- Share button -->
```

## Common Tasks

### 1. Like a Post
```json
[
  { "action": "click", "selector": "article button[aria-label='Like']", "description": "Like the first post" }
]
```

### 2. Comment on a Post
```json
[
  { "action": "click", "selector": "article button[aria-label='Comment']", "description": "Click comment button" },
  { "action": "wait", "ms": 500 },
  { "action": "click", "selector": "[contenteditable='true'][role='textbox']", "description": "Focus comment text area" },
  { "action": "type", "selector": "[contenteditable='true'][role='textbox']", "text": "Great post! Really insightful.", "description": "Type comment" },
  { "action": "click", "selector": "button:has-text('Post')", "description": "Click post button" }
]
```

### 3. Share/Repost
```json
[
  { "action": "click", "selector": "article button[aria-label='Share']", "description": "Click share button" },
  { "action": "wait", "ms": 300 },
  { "action": "click", "selector": "li-button:has-text('Repost')", "description": "Click repost option" }
]
```

## Key Selectors

| Element | Selector |
|---------|----------|
| Like button | `article button[aria-label='Like']` |
| Comment button | `article button[aria-label='Comment']` |
| Share/Repost | `article button[aria-label='Share']` |
| Comment text area | `[contenteditable='true'][role='textbox']` |
| Post button | `button:has-text('Post')` |

## Timing

- Wait 500ms after opening comment modal
- Wait 300ms after clicking share
- 800ms wait after interactions
