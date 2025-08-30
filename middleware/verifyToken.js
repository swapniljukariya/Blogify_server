const jwt = require('jsonwebtoken');

module.exports = function verifyToken(req, res, next) {
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('No Bearer token found');
    return res.status(401).json({ message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received:', token);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = decoded;
    next();
  });
};
