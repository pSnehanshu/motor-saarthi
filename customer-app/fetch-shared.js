const download = require('github-directory-downloader');
const path = require('path');

async function main() {
  const stats = await download(
    'https://github.com/pSnehanshu/motor-saarthi/tree/main/shared',
    path.join(__dirname, 'shared'),
    {
      /** GitHub API token */
      token: process.env.GH_TOKEN,
    },
  );
}

main();
