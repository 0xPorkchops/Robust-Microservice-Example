import autocannon, { Result } from 'autocannon';
import fs from 'fs/promises';
import path from 'path';

const url = 'http://localhost:3000/users';

type TestOptions = {
  title: string;
  connections: number;
  duration: number;
  body: object;
};

const logDir = path.resolve(__dirname, 'logs');

const writeLog = async (result: Result): Promise<void> => {
  const timestamp = new Date().toISOString();
  // Ensure result.title is defined before trying to use it
  const title = result.title || 'untitled_test'; 
  const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}-${timestamp}.json`;
  const filePath = path.join(logDir, fileName);

  const log = {
    title: title,
    timestamp,
    requestsPerSecond: result.requests.average,
    latency: result.latency.average,
    throughput: result.throughput.average,
    non2xx: result['non2xx'] || 0,
  };

  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(log, null, 2), 'utf-8');
  console.log(`[log] Results written to ${filePath}`);
};

const runTest = (options: TestOptions): void => {
  const { title, connections, duration, body } = options;

  const instance = autocannon({
    title,
    url,
    method: 'POST',
    connections,
    duration,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, async (err: any, result: Result) => {
    if (err) {
      console.error(`[${title}] Test failed:`, err);
    } else {
      console.log(`[${title}] Requests per second: ${result.requests.average}`);
      // Pass the title to writeLog through the result object
      result.title = title; 
      await writeLog(result);
    }
  });

  autocannon.track(instance, { renderProgressBar: true });
};

// Load test: expected input and concurrency
runTest({
  title: 'Load Test (Valid Users)',
  connections: 20,
  duration: 10,
  body: { name: 'Alice', email: 'alice@example.com', age: 28 },
});

// Negative test: bad input that should fail validation
// setTimeout(() => runTest({
//   title: 'Negative Test (Bad Email)',
//   connections: 10,
//   duration: 5,
//   body: { name: '', email: 'not-an-email', age: 10 },
// }), 12000); 

// Stress test: high concurrency
// setTimeout(() => runTest({
//   title: 'Stress Test (Overload)',
//   connections: 100,
//   duration: 10,
//   body: { name: 'Stressy', email: 'stress@example.com', age: 35 },
// }), 19000);