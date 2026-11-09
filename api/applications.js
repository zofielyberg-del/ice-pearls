module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers['authorization'];
  const pass = authHeader ? authHeader.replace(/^Bearer\s+/, '') : req.query.token;

  if (pass !== 'loop26') {
    return res.status(401).json({ error: 'Obehörig åtkomst' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/applications?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      console.error('Supabase fetch error:', err);
    }
  }

  // Fallback
  return res.status(200).json([]);
};
