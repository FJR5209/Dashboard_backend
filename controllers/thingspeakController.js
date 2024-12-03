const axios = require('axios');

// Função para buscar os dados do ThingSpeak
const getThingSpeakData = async (req, res) => {
  try {
    const response = await axios.get(`https://api.thingspeak.com/channels/${process.env.THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${process.env.THINGSPEAK_API_KEY}&results=2`);
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar dados do ThingSpeak:', error);
    res.status(500).json({ message: 'Erro ao buscar dados do ThingSpeak' });
  }
};

module.exports = { getThingSpeakData };
