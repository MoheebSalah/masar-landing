---
name: verify
description: Build, launch, and visually drive this Next.js landing page to verify changes at the rendered surface.
---

# Verifying masar-landing changes

## Launch

- The user usually already has `next dev` running on **http://localhost:3000** (starting a second server fails with "Another next dev server is already running" and falls back to :3001 before exiting). Check :3000 first with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`.
- Gotcha: Turbopack sometimes misses `globals.css` edits made while the server runs — utilities regenerate but authored CSS blocks stay stale. A real content change to the file (append/remove a comment, not just `touch`) forces the rebuild.

## Drive (headless Chrome over CDP, no deps)

Chrome lives at `C:/Program Files/Google/Chrome/Application/chrome.exe`. Launch with `--headless=new --remote-debugging-port=<port> --user-data-dir=<tmp> --window-size=1680,1050 --hide-scrollbars`, then talk CDP over Node's built-in `WebSocket` (fetch `http://127.0.0.1:<port>/json` for the page target). Useful commands: `Page.navigate`, `Runtime.evaluate` (scroll/click via JS), `Input.dispatchMouseEvent` (drag gestures), `Page.captureScreenshot`.

- Wait ~10–12s after navigate: dev compile + the site's loader animation.
- The page scrolls with Lenis, but `window.scrollTo` works for jumping to sections (`document.getElementById("app-preview")` etc.).
- GSAP ScrollTrigger entrance animations need ~3s settle after scrolling into a section before screenshotting.
- Enable `Runtime.enable` and collect `consoleAPICalled`/`exceptionThrown` to catch page errors.
- Screenshot colors can mislead: carousel side slides render at reduced opacity over the section background. Sample pixels (PowerShell `System.Drawing` `GetPixel`) or read computed styles before concluding a theme/color bug.

## Flows worth driving

- Phone showcase (`#app-preview`): drag the carousel (mouse press + ~20 moves + release), click the dots (`[aria-label^="الشاشة"]`), toggle dark/light (buttons containing داكن/فاتح — the switch uses a View Transitions circle reveal; don't screenshot mid-transition when judging the settled state).
