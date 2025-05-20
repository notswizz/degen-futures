// Diagnostic API to track refresh patterns
const refreshEvents = [];

export default function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Track refresh event
  if (req.method === 'POST') {
    const timestamp = new Date();
    const data = {
      timestamp,
      url: req.body.url,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      ...req.body
    };
    
    refreshEvents.push(data);
    
    // Keep only the last 100 events
    if (refreshEvents.length > 100) {
      refreshEvents.shift();
    }
    
    return res.status(200).json({ success: true });
  }
  
  // Return refresh events
  if (req.method === 'GET') {
    return res.status(200).json(refreshEvents);
  }
  
  return res.status(405).json({ message: 'Method not allowed' });
} 