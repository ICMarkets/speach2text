module.exports = {
    redis_host: process.env.REDIS_DB_HOST || "dev-registration-redis.icmarkets.com",
    redis_port: process.env.REDIS_DB_PORT || "6379",
    port: '8080',
    format: {
        from: 'au',
        to: 'mp3'
    }
}
