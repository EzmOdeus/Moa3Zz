const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const store = require('./videoStore');

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  let userId = req.cookies.userId;
  if (!userId) {
    userId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    res.cookie('userId', userId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
  req.userId = userId;
  next();
});

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Moa3z Reels API',
    version: '1.0.0',
    description: 'API to manage daily reels videos with views, likes and admin stats',
  },
  servers: [
    { 
      url: 'https://moa3-zz.vercel.app/api',
      description: 'Local development server',
    },
  ],
};

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Reels backend is running');
});

const PORT = process.env.PORT || 4000;

store.loadVideos();

// Daily refresh job at midnight local
function scheduleDailyRefresh() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const ms = nextMidnight - now;

  setTimeout(() => {
    store.refreshVideos();
    scheduleDailyRefresh();
  }, ms);
  console.log(`Next daily refresh scheduled in ${Math.round(ms/1000/60)} minutes`);
}

scheduleDailyRefresh();

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
});
