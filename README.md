Project: Pickle Social (structured)

What I changed
- Extracted inline CSS into `css/styles.css`.
- Extracted inline JS into `js/app.js`.
- Added a small Node/Express backend in `server.js` to proxy Payrex securely.
- Fixed the hero image tag in `index.html`.

How to use
- Copy `.env.example` to `.env` and set `PAYREX_SECRET_KEY`.
- Run `npm install` in the project root.
- Start the server with `npm start` for local testing.
- Open `http://localhost:3000` in the browser.
- The frontend calls `/api/create-payment` on the same server.

### Deploying to Vercel
- Remove `server.js` from the deployment target if you only want the static site + serverless API.
- Vercel will use `api/create-payment.js` as your serverless endpoint.
- Set `PAYREX_SECRET_KEY` in Vercel Environment Variables.
- If you want a forced test amount, add `PAYREX_FORCE_AMOUNT=100` in Vercel too.

### Important
- Your site can be hosted on Vercel while the Payrex backend runs as a Vercel API route.
- This means you do not need your PC on for production once deployed.

### Payrex test amount
If you want to force a ₱1 payment while testing, set:
```env
PAYREX_FORCE_AMOUNT=100
```

Logo
- A placeholder base64-encoded logo was added as `logo.jpeg.b64`.
- To create the actual `logo.jpeg` file from the base64, run the provided Node script:

```powershell
node tools\decode-logo.js
```

This writes `logo.jpeg` in the project root. Replace it with your real logo if you have one.

Notes
- I left small inline `style` attributes in place (e.g., status indicators) to minimize markup changes.
- If you want the JS module-scoped or to bundle with a toolchain, I can convert `js/app.js` to ES module syntax.
