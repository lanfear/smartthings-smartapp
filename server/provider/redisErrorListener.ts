/**
 * 'error' listener for the Redis clients. Without one, node treats a dropped connection (e.g. the dev machine going to
 * sleep) as fatal and the whole server exits. With one, node-redis keeps reconnecting on its own (its default backoff)
 * and queues commands sent meanwhile, so this only needs to log. Only adds the listener - client setup is unchanged.
 */
const redisErrorListener = (storeName: string): ((error: unknown) => void) => (error: unknown): void => {
  // eslint-disable-next-line no-console
  console.warn(`Redis connection error in [${storeName}], reconnecting:`, error instanceof Error ? error.message : error);
};

export default redisErrorListener;
