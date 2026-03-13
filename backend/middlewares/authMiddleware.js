const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'supersecret', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const isBorderControl = (req, res, next) => {
  if (req.userRole !== 'border_control') return res.status(403).json({ error: 'Requires Border Control Role' });
  next();
};

const isHumanitarian = (req, res, next) => {
  if (req.userRole !== 'humanitarian') return res.status(403).json({ error: 'Requires Humanitarian Role' });
  next();
};

module.exports = { verifyToken, isBorderControl, isHumanitarian };
