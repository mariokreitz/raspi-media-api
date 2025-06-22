import express from 'express';
import dotenv from 'dotenv';
import mediaRoutes from './routes/media.route.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { logger, morganMiddleware } from './utils/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { checkInternet } from './utils/network.js';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const POSTER_BASE_PATH = process.env.POSTER_BASE_PATH || path.resolve('./data/posters');
app.use('/data/posters', express.static(POSTER_BASE_PATH));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Raspi Media API',
            version: '1.0.0',
            description: 'API for managing and streaming media files',
        },
        servers: [{ url: `http://localhost:${port}` }],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(express.json());
app.use(morganMiddleware);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/media', mediaRoutes);
app.use(errorHandler);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Funny API root endpoint
 *     tags: [Media]
 *     responses:
 *       200:
 *         description: Returns a funny greeting
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
app.get('/', (req, res) => {
    res.json({
        message: '🎬 Welcome to Raspi Media API! Yes, this is the root. No popcorn here, just endpoints. 🍿',
    });
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    checkInternet();
});
