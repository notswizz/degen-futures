import jwt from 'jsonwebtoken';

// A simple utility to decode and view the token contents
export default function handler(req, res) {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'No token found',
        cookies: req.cookies,
        hasAuthHeader: !!req.headers.authorization
      });
    }
    
    // Decode without verification to see what's in the token
    const decoded = jwt.decode(token);
    
    return res.status(200).json({
      message: 'Token decoded',
      decoded,
      token: token.substring(0, 20) + '...' // Show just the beginning for security
    });
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error decoding token',
      error: error.message
    });
  }
} 