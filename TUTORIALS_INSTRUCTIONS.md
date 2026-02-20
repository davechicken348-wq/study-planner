Tutorials Page — YouTube API setup

What this does

- When you provide a YouTube Data API key, the Tutorials page will attempt to fetch up to 40 videos matching "I.T reload" and display them in the YouTube section.
- If no API key is provided (or the request fails), the page falls back to the bundled videos in `tutorials.json`.

How to get an API key

1. Go to https://console.developers.google.com/ and sign in with your Google account.
2. Create or select a project.
3. In the left menu go to "APIs & Services" → "Library".
4. Search for "YouTube Data API v3" and click it, then click "Enable".
5. In "APIs & Services" → "Credentials" click "Create credentials" → "API key".
6. Copy the generated API key.

How to provide the key to the page

- Open `tutorials.html` and add the following script tag before the `tutorials.js` script include (replace YOUR_KEY):

<script>
  window.APP_CONFIG = { YOUTUBE_API_KEY: 'YOUR_KEY' };
</script>

<script src="tutorials.js" defer></script>

Notes & limitations

- The YouTube Data API has quota limits. Frequent or large requests may exhaust your quota; for production use consider server-side caching.
- The client-side approach exposes the API key to the browser; for sensitive keys or higher security, proxy the API requests from your server.
- The search query used is "I.T reload" (as requested). Modify the query in `tutorials.js` if you'd like a different search term (e.g., "IT tutorials", "programming tutorials").

If you want, I can also add a small UI input on the page to paste a key at runtime (stored in localStorage) instead of editing the HTML directly.
