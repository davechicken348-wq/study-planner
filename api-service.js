// API Service for Tutorials Page
const APIService = {
  keys: {
    youtube: localStorage.getItem('api_key_youtube') || '',
    github: localStorage.getItem('api_key_github') || '',
    medium: localStorage.getItem('api_key_medium') || ''
  },

  // Dev.to API (No key required)
  async fetchDevToArticles(tag = '', page = 1) {
    try {
      const url = `https://dev.to/api/articles?tag=${tag}&page=${page}&per_page=20`;
      const res = await fetch(url);
      return await res.json();
    } catch (e) {
      console.error('Dev.to error:', e);
      return [];
    }
  },

  // YouTube API
  async fetchYouTubeChannels(query) {
    if (!this.keys.youtube) throw new Error('API_KEY_REQUIRED');
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=channel&maxResults=20&key=${this.keys.youtube}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.items || [];
    } catch (e) {
      console.error('YouTube error:', e);
      throw e;
    }
  },

  async fetchYouTubeVideos(query) {
    if (!this.keys.youtube) throw new Error('API_KEY_REQUIRED');
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=20&key=${this.keys.youtube}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.items || [];
    } catch (e) {
      console.error('YouTube error:', e);
      throw e;
    }
  },

  // GitHub API
  async fetchGitHubRepos(language = 'javascript') {
    const headers = this.keys.github ? { 'Authorization': `token ${this.keys.github}` } : {};
    try {
      const url = `https://api.github.com/search/repositories?q=language:${language}&sort=stars&order=desc&per_page=20`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      return data.items || [];
    } catch (e) {
      console.error('GitHub error:', e);
      return [];
    }
  },

  // Hashnode API (No key required)
  async fetchHashnodeArticles(tag = 'javascript') {
    try {
      const query = `{
        tagCategories(slug: "${tag}") {
          posts(first: 20) {
            edges {
              node {
                title
                brief
                slug
                coverImage
                author { name }
                dateAdded
                readTime
              }
            }
          }
        }
      }`;
      const res = await fetch('https://api.hashnode.com/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      return data.data?.tagCategories?.posts?.edges || [];
    } catch (e) {
      console.error('Hashnode error:', e);
      return [];
    }
  },

  // Save API key
  saveKey(service, key) {
    this.keys[service] = key;
    localStorage.setItem(`api_key_${service}`, key);
  },

  // Remove API key
  removeKey(service) {
    this.keys[service] = '';
    localStorage.removeItem(`api_key_${service}`);
  }
};

// API Key Modal Manager
const APIKeyModal = {
  show(service, onSave) {
    const guides = {
      youtube: {
        title: 'YouTube Data API v3',
        steps: [
          '1. Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>',
          '2. Create a new project or select existing',
          '3. Enable "YouTube Data API v3"',
          '4. Go to Credentials → Create Credentials → API Key',
          '5. Copy your API key and paste below'
        ],
        link: 'https://developers.google.com/youtube/v3/getting-started'
      },
      github: {
        title: 'GitHub Personal Access Token',
        steps: [
          '1. Go to <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings → Tokens</a>',
          '2. Click "Generate new token (classic)"',
          '3. Give it a name and select "public_repo" scope',
          '4. Click "Generate token"',
          '5. Copy your token and paste below (Optional - increases rate limit)'
        ],
        link: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token'
      },
      medium: {
        title: 'Medium Integration Token',
        steps: [
          '1. Go to <a href="https://medium.com/me/settings" target="_blank">Medium Settings</a>',
          '2. Scroll to "Integration tokens"',
          '3. Enter a description and click "Get token"',
          '4. Copy your token and paste below'
        ],
        link: 'https://github.com/Medium/medium-api-docs'
      }
    };

    const guide = guides[service];
    const overlay = document.createElement('div');
    overlay.className = 'api-modal-overlay';
    overlay.innerHTML = `
      <div class="api-modal">
        <div class="api-modal-header">
          <h3><i class="fas fa-key"></i> ${guide.title}</h3>
          <button class="api-modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="api-modal-body">
          <div class="api-guide">
            <h4>How to get your API key:</h4>
            <ol>${guide.steps.map(s => `<li>${s}</li>`).join('')}</ol>
            <a href="${guide.link}" target="_blank" class="api-docs-link">
              <i class="fas fa-book"></i> View Official Documentation
            </a>
          </div>
          <div class="api-input-group">
            <label>Enter your API key:</label>
            <input type="password" class="api-key-input" placeholder="Paste your API key here..." />
            <button class="api-toggle-visibility"><i class="fas fa-eye"></i></button>
          </div>
          <div class="api-modal-actions">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-save-key"><i class="fas fa-save"></i> Save Key</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector('.api-key-input');
    const toggleBtn = overlay.querySelector('.api-toggle-visibility');
    const saveBtn = overlay.querySelector('.btn-save-key');
    const cancelBtn = overlay.querySelector('.btn-cancel');
    const closeBtn = overlay.querySelector('.api-modal-close');

    toggleBtn.onclick = () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      toggleBtn.innerHTML = input.type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    };

    const close = () => overlay.remove();
    closeBtn.onclick = close;
    cancelBtn.onclick = close;
    overlay.onclick = (e) => e.target === overlay && close();

    saveBtn.onclick = () => {
      const key = input.value.trim();
      if (key) {
        APIService.saveKey(service, key);
        onSave(key);
        close();
      }
    };

    input.focus();
  }
};
