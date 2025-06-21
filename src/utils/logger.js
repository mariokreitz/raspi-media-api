import winston from 'winston';
import morgan from 'morgan';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        }),
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'data/app.log' }),
    ],
});

const morganMiddleware = morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim()),
    },
});

export { logger, morganMiddleware };
