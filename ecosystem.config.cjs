// PM2 process configuration for the Freedcamp MCP HTTP+OAuth server.
//
//   pm2 start ecosystem.config.cjs
//   pm2 save
//
// Logs go to ./logs/. Tail with:
//   pm2 logs fc-mcp-oauth

module.exports = {
    apps: [
        {
            name: "fc-mcp-oauth",
            script: "index.js",
            cwd: __dirname,
            interpreter: "node",
            instances: 1,
            exec_mode: "fork",
            max_memory_restart: "512M",
            autorestart: true,
            max_restarts: 10,
            min_uptime: "30s",
            out_file: "logs/out.log",
            error_file: "logs/err.log",
            merge_logs: true,
            time: true,
            env: {
                NODE_ENV: "production",
                MCP_TRANSPORT: "http",
                PORT: "8527",
                HOST: "127.0.0.1",
                MCP_PUBLIC_URL: "https://mcp-oauth.freedcamp.top",
                OAUTH_TOKEN_SECRET: "88f2e02a7a36bae55f8c845bf5ce4d3cea8334df05c796c5cebee55a89e4414a"
            }
        },
        {
            name: "fc-mcp-oauth-com",
            script: "index.js",
            cwd: __dirname,
            interpreter: "node",
            instances: 1,
            exec_mode: "fork",
            max_memory_restart: "512M",
            autorestart: true,
            max_restarts: 10,
            min_uptime: "30s",
            out_file: "logs/out-com.log",
            error_file: "logs/err-com.log",
            merge_logs: true,
            time: true,
            env: {
                NODE_ENV: "production",
                MCP_TRANSPORT: "http",
                PORT: "8528",
                HOST: "127.0.0.1",
                MCP_PUBLIC_URL: "https://mcp.freedcamp.com",
                OAUTH_TOKEN_SECRET: "35ba3bae28e60119a7016f617cd1f52404578fd1a07cac8bbfd03397de50e92e"
            }
        }
    ]
};
