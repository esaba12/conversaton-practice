import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const entry = fileURLToPath(new URL('./node_modules/@upstash/context7-mcp/dist/index.js', import.meta.url));
const server = spawn(process.execPath, [entry], { stdio: ['pipe', 'pipe', 'ignore'] });
const lines = createInterface({ input: server.stdout });
let finished = false;
const finish = (error) => {
  if (finished) return;
  finished = true;
  clearTimeout(timeout);
  lines.close();
  server.kill();
  if (error) { console.error(error); process.exitCode = 1; }
};
const timeout = setTimeout(() => finish('MCP check timed out'), 15000);
const send = message => server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`);
server.on('error', error => finish(error.message));
server.on('exit', () => { if (!finished) finish('MCP server exited before discovery completed'); });
server.stdin.on('error', error => finish(error.message));
lines.on('line', line => {
  try {
    const message = JSON.parse(line);
    if (message.error) return finish(`MCP error: ${message.error.code}`);
    if (message.id === 1) {
      send({ method: 'notifications/initialized' });
      send({ id: 2, method: 'tools/list', params: {} });
    } else if (message.id === 2) {
      const names = message.result.tools.map(tool => tool.name);
      if (!names.includes('resolve-library-id') || !names.includes('query-docs')) {
        return finish('Expected Context7 documentation tools are missing');
      }
      console.log(`Context7 MCP handshake passed; tools: ${names.join(', ')}`);
      console.log('Checks local startup and discovery; remote documentation retrieval is not tested.');
      finish();
    }
  } catch (error) { finish(error.message); }
});
send({ id: 1, method: 'initialize', params: {
  protocolVersion: '2025-06-18', capabilities: {},
  clientInfo: { name: 'local-tool-check', version: '1.0.0' },
} });
