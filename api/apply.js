module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Endast POST är tillåtet' });
  }

  try {
    const { ssoName, discord, age, level, motivation } = req.body || {};

    if (!ssoName || !age) {
      return res.status(400).json({ error: 'Obligatoriska fält saknas' });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

    // 1. Spara till Supabase om konfigurerat
    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/applications`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            sso_name: ssoName,
            discord: discord || '-',
            age: age,
            level: level || '-',
            motivation: motivation || '-',
            status: 'Ny'
          })
        });
      } catch (dbErr) {
        console.error('Kunde inte spara till Supabase:', dbErr);
      }
    }

    // 2. Skicka till Discord Webhook om konfigurerat
    if (webhookUrl) {
      try {
        const embedPayload = {
          username: 'Ice Pearls Ansökningar',
          embeds: [
            {
              title: '✨ Ny Medlemsansökan till Ice Pearls! ✨',
              color: 0xFAD2E1, // Babyrosa hex
              description: `En ny ansökan har inkommit via hemsidan.`,
              fields: [
                { name: '👤 SSO-Namn', value: String(ssoName), inline: true },
                { name: '🎂 Ålder', value: String(age), inline: true },
                { name: '⭐ SSO-Level', value: String(level || '-'), inline: true },
                { name: '💬 Discord', value: String(discord || 'Ej angivet'), inline: true },
                { name: '📝 Motivering', value: String(motivation || 'Ingen motivering angiven') }
              ],
              footer: {
                text: 'Ice Pearls • Vuxenklubb 18+ • Airstar'
              },
              timestamp: new Date().toISOString()
            }
          ]
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(embedPayload)
        });
      } catch (dcErr) {
        console.error('Kunde inte skicka till Discord:', dcErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Ansökan mottagen och behandlad!'
    });
  } catch (error) {
    console.error('Fel vid hantering av ansökan:', error);
    return res.status(500).json({ error: 'Kunde inte behandla ansökan' });
  }
};
