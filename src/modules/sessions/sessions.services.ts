import redis from "../../configs/redis";

export default class SessionServices {
    /**
     * Adds a new session to Redis.
     * @param sessionId - The unique session identifier.
     * @param userId - The ID of the user.
     * @param expiresIn - Expiration time in seconds.
     */
    static async addSession(sessionId: string, userId: string, expiresIn: number) {
        return await redis.set(sessionId, userId, 'EX', expiresIn);
    }

    /**
     * Retrieves a session from Redis.
     * @param sessionId - The unique session identifier.
     * @returns - The user ID or null if the session does not exist.
     */
    static async getSession(sessionId: string) {
        return await redis.get(sessionId);
    }

    /**
     * Retrieves all sessions from Redis.
     * @returns - An object with session IDs as keys and associated user IDs as values.
     */
    static async getAllSessions(): Promise<{ [key: string]: string }> {
        const sessions: { [key: string]: string } = {};

        // Initialize the cursor for SCAN operation
        let cursor = "0";

        do {
            // Use SCAN command to get the keys with the given pattern
            const [newCursor, keys] = await redis.scan(cursor, "MATCH", "session-*");

            // Update cursor for the next iteration
            cursor = newCursor;

            if (keys.length > 0) {
                // Fetch values for the keys in bulk using MGET
                const values = await redis.mget(...keys);

                // Combine keys and values into the sessions object
                keys.forEach((key, index) => {
                    const userId = values[index];
                    if (userId) {
                        sessions[key] = userId;
                    }
                });
            }
        } while (cursor !== "0"); // Continue until the cursor points to 0, indicating the end

        return sessions;
    }


    /**
     * Removes a session from Redis.
     * @param sessionId - The unique session identifier.
     */
    static async removeSession(sessionId: string) {
        await redis.del(sessionId);
    }

    /**
     * Checks if a session exists in Redis.
     * @param sessionId - The unique session identifier.
     * @returns - True if the session exists, false otherwise.
     */
    static async sessionExists(sessionId: string) {
        const session = await redis.exists(sessionId);
        return session === 1;
    }

    /**
     * Refreshes a user's session by creating a new session and JWT.
     * @param userId - The ID of the user.
     * @param expiresIn - Expiration time in seconds for the new session.
     * @returns - The new JWT for the session.
     */
    static async refreshSession(sessionId: string, userId: string, expiresIn: number) {
        await this.removeSession(sessionId)
        return await redis.set(sessionId, userId, 'EX', expiresIn);
    }
}
