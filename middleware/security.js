import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// Security middleware configuration
export const securityMiddleware = (app) => {
  // Helmet helps secure Express apps by setting various HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized NoSQL injection attempt: ${key}`);
    }
  }));

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use((req, res, next) => {
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (Array.isArray(req.query[key]) && req.query[key].length > 1) {
          req.query[key] = req.query[key][0];
        }
      });
    }
    next();
  });
};

// CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://coal-mine-sepia.vercel.app',
      process.env.CLIENT_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  next();
};

// Request logging for security auditing
export const securityLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const path = req.path;
  const userAgent = req.get('user-agent');

  // Log suspicious activities
  if (req.body) {
    const bodyStr = JSON.stringify(req.body).toLowerCase();
    const suspiciousPatterns = [
      '<script', 'javascript:', 'onerror=', 'onload=',
      '$where', '$ne', 'drop table', 'union select'
    ];

    const hasSuspicious = suspiciousPatterns.some(pattern => bodyStr.includes(pattern));
    if (hasSuspicious) {
      console.warn(`[SECURITY] Suspicious request detected:`, {
        timestamp,
        ip,
        method,
        path,
        userAgent,
        body: req.body
      });
    }
  }

  next();
};

// Input sanitization helper
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potential XSS
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  return input;
};

// Password strength checker
export const checkPasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&#]/.test(password);
  
  const strength = {
    length: password.length >= minLength,
    uppercase: hasUpperCase,
    lowercase: hasLowerCase,
    numbers: hasNumbers,
    special: hasSpecialChar,
    score: 0
  };

  strength.score = [
    strength.length,
    strength.uppercase,
    strength.lowercase,
    strength.numbers,
    strength.special
  ].filter(Boolean).length;

  strength.isStrong = strength.score >= 4;
  strength.level = strength.score >= 4 ? 'strong' : strength.score >= 3 ? 'medium' : 'weak';

  return strength;
};

export default {
  securityMiddleware,
  corsOptions,
  securityHeaders,
  securityLogger,
  sanitizeInput,
  checkPasswordStrength
};
