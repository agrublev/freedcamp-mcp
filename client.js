import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import "dotenv/config";

const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "freedcamp-mcp-server"],
    env: {
        ...process.env,
        FREEDCAMP_API_KEY: process.env.FREEDCAMP_API_KEY,
        FREEDCAMP_API_SECRET: process.env.FREEDCAMP_API_SECRET
    },
    stderr: "pipe"
});

// Surface anything the server prints to stderr (validation failures, stack traces, etc.)
transport.stderr?.on("data", (chunk) => {
    process.stderr.write(`[server stderr] ${chunk}`);
});

transport.onerror = (err) => {
    console.error("[transport error]", err);
};

const client = new Client({ name: "freedcamp-mcp-client", version: "1.1.2" }, { capabilities: {} });

client.onerror = (err) => {
    console.error("[client error]", err);
};

async function run(label, fn) {
    try {
        const result = await fn();
        console.log(`\n=== ${label} OK ===`);
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (err) {
        console.error(`\n=== ${label} FAILED ===`);
        // MCP errors carry { code, message, data } — print all of it
        console.error("message:", err?.message);
        if (err?.code !== undefined) console.error("code:", err.code);
        if (err?.data !== undefined) console.error("data:", JSON.stringify(err.data, null, 2));
        console.error("stack:", err?.stack);
        return null;
    }
}

try {
    await client.connect(transport);
} catch (err) {
    console.error("[connect failed]", err);
    process.exit(1);
}

await run("listTools", () => client.listTools());

// Example tool call — uncomment and edit args to test:
await run("callTool fc_fetch_projects", () =>
    client.callTool({ name: "fc_fetch_projects", arguments: {} })
);

await client.close();
