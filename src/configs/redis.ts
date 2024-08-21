import Redis from 'ioredis';
import { errorlogger } from './logger';
import { config } from 'dotenv';
config()

const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost", // Redis server host
    port: Number(process.env.REDIS_PORT) || 6379, // Redis server port
    password: process.env.REDIS_PASSWORD || "root", // Redis server password (if any)
});

redis.on("error", (error) => {
    errorlogger.error(`Redis error: ${error.message}`);
    throw error
});

export default redis;
