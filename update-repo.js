const fs = require('fs');
const path = require('path');

// Fungsi untuk mendapatkan repositories
async function getRecentRepos(username) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
      {
        headers: {
          'User-Agent': 'GitHub-Profile-Bot',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();
    return repos.filter(repo => !repo.fork);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [];
  }
}

// Fungsi untuk generate card HTML
function generateRepoCard(repo) {
  const stars = repo.stargazers_count;
  const forks = repo.forks_count;
  const language = repo.language || 'Unknown';
  const description = repo.description || 'No description available';
  const updatedAt = new Date(repo.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Language colors
  const languageColors = {
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    PHP: '#4F5D95',
    Java: '#b07219',
    TypeScript: '#2b7489',
    Shell: '#89e051',
    Unknown: '#8b949e'
  };

  const color = languageColors[language] || '#8b949e';

  return `
<a href="${repo.html_url}" target="_blank">
  <img width="278" src="https://github-readme-stats.vercel.app/api/pin/?username=${repo.owner.login}&repo=${repo.name}&theme=tokyonight&hide_border=true&bg_color=0D1117&title_color=58A6FF&icon_color=58A6FF&text_color=C9D1D9&border_radius=15" alt="${repo.name}" />
</a>`;
}

// Fungsi utama untuk update README
async function updateReadme(username) {
  const readmePath = path.join(__dirname, 'README.md');
  
  try {
    // Baca README
    let readme = fs.readFileSync(readmePath, 'utf8');
    
    // Ambil repos terbaru
    console.log(`Fetching repositories for ${username}...`);
    const repos = await getRecentRepos(username);
    
    if (repos.length === 0) {
      console.log('No repositories found');
      return;
    }

    // Generate cards
    const repoCards = repos.slice(0, 6).map(repo => generateRepoCard(repo));
    
    // Format menjadi grid 3 kolom
    let repoSection = '<div align="center">\n';
    for (let i = 0; i < repoCards.length; i += 3) {
      repoSection += '  <div>\n';
      repoSection += repoCards.slice(i, i + 3).join('\n');
      repoSection += '\n  </div>\n';
    }
    repoSection += '</div>\n';

    // Tambahkan timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    repoSection += `\n<div align="center">\n  <sub>Last updated: ${timestamp} WITA</sub>\n</div>\n`;

    // Replace section
    const startMarker = '<!-- START_SECTION:repos -->';
    const endMarker = '<!-- END_SECTION:repos -->';
    
    const startIndex = readme.indexOf(startMarker);
    const endIndex = readme.indexOf(endMarker);
    
    if (startIndex !== -1 && endIndex !== -1) {
      readme = 
        readme.substring(0, startIndex + startMarker.length) +
        '\n' + repoSection +
        readme.substring(endIndex);
      
      fs.writeFileSync(readmePath, readme);
      console.log('✅ README updated successfully!');
      console.log(`📦 Updated ${repos.length} repositories`);
    } else {
      console.error('❌ Markers not found in README');
    }
  } catch (error) {
    console.error('Error updating README:', error);
    process.exit(1);
  }
}

// Jalankan script
const username = process.env.GITHUB_USERNAME || 'keyyH4B';
updateReadme(username);
