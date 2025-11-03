# AI Chatbot - Terminal Theme

This project is a modern, single-page AI Chatbot website designed with a developer-focused, terminal-like aesthetic. It uses only HTML, CSS, and vanilla JavaScript.

## Features

- **Terminal-Inspired UI**: A dark, sleek interface that mimics a code editor or terminal.
- **Monospace Font**: Uses JetBrains Mono for a clean, code-like feel.
- **Neon Aesthetics**: Features glowing text and highlights in cyan, magenta, and green.
- **Typewriter Effect**: Bot messages are rendered with a classic typewriter animation.
- **Command System**: Includes simple slash commands like `/clear` and `/help` handled on the client-side.
- **Responsive Design**: The layout adapts to smaller screens for a good mobile experience.
- **No Dependencies**: Built purely with vanilla HTML, CSS, and JavaScript.

## How to Run

1.  Clone or download the repository.
2.  Open the `index.html` file in any modern web browser.

That's it! The chatbot is fully client-side.

## How to Customize

The visual theme can be easily tweaked by editing the CSS variables at the top of the `style.css` file.

### Theme Colors

Open `style.css` and find the `:root` block. You can change the values of these variables to alter the color palette across the entire application.

```css
:root {
    --background-color: #0d1117;      /* Main background */
    --primary-accent: #00ffff;       /* Neon Cyan for prompts, buttons */
    --secondary-accent: #ff00ff;     /* Neon Magenta for bot prefix */
    --syntax-green: #00ff88;         /* Not used by default, but available */
    --user-input-color: #39c0ba;      /* Color for user prefix */
    --text-color: #e5e5e5;           /* Default text color */
}
```

### Glow Effects

The neon glow is created using the `box-shadow` CSS property. You can adjust the color, spread, and intensity of the glows.

- **Main Window Glow**: In `.ide-container`, you can change the `box-shadow` color. I recommend using a translucent version of your `--primary-accent` color.

  ```css
  .ide-container {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1); /* Adjust the second part */
  }
  ```

- **Input Focus Glow**: In `#chat-input:focus`, you can change the `box-shadow` to match your desired accent color.

  ```css
  #chat-input:focus {
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); /* Adjust color and opacity */
  }
  ```

- **Button Hover Glow**: In `.send-button:hover`, you can adjust the `box-shadow` that appears when you hover over the send button.

  ```css
  .send-button:hover {
      box-shadow: 0 0 15px var(--primary-accent); /* Uses the primary accent color */
  }
  ```
