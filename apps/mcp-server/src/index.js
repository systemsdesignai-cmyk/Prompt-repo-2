#!/usr/bin/env node

const protocolVersion = '2024-11-05';

const tools = [
  {
    name: 'health',
    description: 'Check whether the Prompt Repository MCP server is running.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }
];

let buffer = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;

  for (;;) {
    const newlineIndex = buffer.indexOf('\n');
    if (newlineIndex === -1) {
      return;
    }

    const rawMessage = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (rawMessage.length > 0) {
      handleRawMessage(rawMessage);
    }
  }
});

function handleRawMessage(rawMessage) {
  let message;

  try {
    message = JSON.parse(rawMessage);
  } catch (error) {
    sendError(null, -32700, 'Parse error', error.message);
    return;
  }

  if (!message || typeof message !== 'object') {
    sendError(null, -32600, 'Invalid Request');
    return;
  }

  handleMessage(message);
}

function handleMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    sendResult(id, {
      protocolVersion,
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'prompt-repository-mcp-server',
        version: '1.0.0'
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    sendResult(id, { tools });
    return;
  }

  if (method === 'tools/call') {
    callTool(id, params);
    return;
  }

  sendError(id, -32601, `Method not found: ${method}`);
}

function callTool(id, params = {}) {
  if (params.name !== 'health') {
    sendError(id, -32602, `Unknown tool: ${params.name}`);
    return;
  }

  sendResult(id, {
    content: [
      {
        type: 'text',
        text: 'Prompt Repository MCP server is running.'
      }
    ]
  });
}

function sendResult(id, result) {
  if (id === undefined || id === null) {
    return;
  }

  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, result })}\n`);
}

function sendError(id, code, message, data) {
  const error = { code, message };

  if (data !== undefined) {
    error.data = data;
  }

  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, error })}\n`);
}
