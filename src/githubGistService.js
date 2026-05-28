const GITHUB_API_URL = 'https://api.github.com';
const GIST_FILENAME = 'prompt-repository-data.json';

export const githubGistService = {
  /**
   * Fetches a Gist's content.
   */
  async fetchGist(gistId, token) {
    const response = await fetch(`${GITHUB_API_URL}/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch Gist');
    }

    const gist = await response.json();
    const file = gist.files[GIST_FILENAME];
    
    if (!file) {
      throw new Error('Data file not found in Gist');
    }

    if (file.truncated) {
      // If the file is too large, we need to fetch the raw content
      const rawResponse = await fetch(file.raw_url, {
        headers: { 'Authorization': `token ${token}` }
      });
      return await rawResponse.json();
    }

    return JSON.parse(file.content);
  },

  /**
   * Updates an existing Gist.
   */
  async updateGist(gistId, token, data) {
    const response = await fetch(`${GITHUB_API_URL}/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update Gist');
    }

    return await response.json();
  },

  /**
   * Creates a new private Gist.
   */
  async createGist(token, data) {
    const response = await fetch(`${GITHUB_API_URL}/gists`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Prompt Repository Data Sync',
        public: false,
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create Gist');
    }

    return await response.json();
  },
};
