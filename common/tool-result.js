/**
 * MCP CallToolResult.structuredContent must be a JSON object (a record).
 * The protocol schema is `z.record(z.string(), z.unknown())` — arrays, scalars,
 * and null are rejected by strict clients with:
 *   Invalid tools/call result: expected record, received array
 *
 * Text content stays a JSON serialization of the same object so the two fields
 * agree. Object payloads pass through unchanged.
 */
export function asStructuredContent(data) {
    if (data !== null && typeof data === "object" && !Array.isArray(data)) {
        return data;
    }
    return Array.isArray(data) ? { items: data } : { value: data ?? null };
}

export function ok(data) {
    const structuredContent = asStructuredContent(data);
    return {
        content: [{ type: "text", text: JSON.stringify(structuredContent, null, 2) }],
        structuredContent
    };
}
