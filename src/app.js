import express from 'express';
import dotenv from 'dotenv';
import mediaRoutes from './routes/media.route.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import { logger, morganMiddleware } from './utils/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { checkInternet } from './utils/network.util.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Heim-Netflix API',
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

app.get('/', (req, res) => {
    res.send('Heim-Netflix API is running');
});

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    checkInternet();
});
