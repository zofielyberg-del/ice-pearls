const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mavozooclmpfspznrwun.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_GYb_4HfTwWhbDSihMcRnWw_tDp2bDqF';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const authHeader = req.headers['authorization'];
  const pass = authHeader ? authHeader.replace(/^Bearer\s+/, '') : req.query.token;

  if (pass !== 'loop26') {
    return res.status(401).json({ error: 'Obehörig åtkomst' });
  }

  // 1. GET ALL APPLICATIONS
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      console.error('Supabase fetch error:', err);
      return res.status(500).json({ error: 'Kunde inte hämta ansökningar' });
    }
  }

  // 2. PATCH STATUS
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ error: 'ID och status krävs' });
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('Supabase update error:', err);
      return res.status(500).json({ error: 'Kunde inte uppdatera status' });
    }
  }

  // 3. DELETE APPLICATION
  if (req.method === 'DELETE') {
    const id = req.query.id || (req.body && req.body.id);
    if (!id) {
      return res.status(400).json({ error: 'ID krävs för borttagning' });
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Supabase delete error:', err);
      return res.status(500).json({ error: 'Kunde inte ta bort ansökan' });
    }
  }

  return res.status(405).json({ error: 'Metod stöds ej' });
};
