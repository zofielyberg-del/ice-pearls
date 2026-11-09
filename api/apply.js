module.exports = async (req, res) => {
  // Tillåt CORS
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

    // Om en Discord Webhook URL finns inlagd i Vercel miljövariabler, skicka direkt till Discord!
    if (webhookUrl) {
      const embedPayload = {
        username: 'Ice Pearls Ansökningar',
        avatar_url: 'https://raw.githubusercontent.com/favicon.ico',
        embeds: [
          {
            title: '✨ Ny Medlemsansökan till Ice Pearls! ✨',
            color: 0xFAD2E1, // Babyrosa / Pärlrosa färgkod i hex (decimal 16437985)
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
    }

    return res.status(200).json({
      success: true,
      message: 'Ansökan mottagen och sparad!'
    });
  } catch (error) {
    console.error('Fel vid hantering av ansökan:', error);
    return res.status(500).json({ error: 'Kunde inte behandla ansökan' });
  }
};
