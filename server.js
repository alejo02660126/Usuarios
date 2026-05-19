const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3333;
const HOST = '0.0.0.0';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.roblox.com',
        'Referer': 'https://www.roblox.com/',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error')); }
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (url.pathname === '/search') {
    const query = url.searchParams.get('q') || '';
    if (!query) { res.end(JSON.stringify({ found: false })); return; }

    try {
      const searchData = await fetchUrl(
        `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(query)}&limit=6`
      );

      if (!searchData?.data?.length) {
        res.end(JSON.stringify({ found: false }));
        return;
      }

      const user = searchData.data.find(u =>
        u.name.toLowerCase() === query.toLowerCase()
      ) || searchData.data[0];

      const thumbData = await fetchUrl(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`
      );

      const avatarUrl = thumbData?.data?.[0]?.imageUrl || '';

      res.end(JSON.stringify({
        found: true,
        userId: user.id,
        userName: user.name,
        displayName: user.displayName || user.name,
        avatarUrl
      }));

    } catch(e) {
      res.end(JSON.stringify({ found: false, error: e.message }));
    }

  } else {
    res.end(JSON.stringify({ ok: true, msg: 'Servidor activo' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en ${HOST}:${PORT}`);
});
