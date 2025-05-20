import jwt from 'jsonwebtoken';
import Cookies from 'js-cookie';

export const getToken = () => {
  return Cookies.get('token');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Don't actually verify on client side (as secret not available)
    // Just check if token exists and isn't expired
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp > Date.now() / 1000;
  } catch (error) {
    return false;
  }
};

export const verifyToken = async (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

export const getServerSideUser = async (req) => {
  const token = req.cookies.token;
  
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}; 