"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autocannon_1 = __importDefault(require("autocannon"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const url = 'http://localhost:3000/users';
const logDir = path_1.default.resolve(__dirname, 'logs');
const writeLog = async (result) => {
    const timestamp = new Date().toISOString();
    // Ensure result.title is defined before trying to use it
    const title = result.title || 'untitled_test';
    const fileName = `${title.replace(/\s+/g, '_').toLowerCase()}-${timestamp}.json`;
    const filePath = path_1.default.join(logDir, fileName);
    const log = {
        title: title,
        timestamp,
        requestsPerSecond: result.requests.average,
        latency: result.latency.average,
        throughput: result.throughput.average,
        non2xx: result['non2xx'] || 0,
    };
    await promises_1.default.mkdir(logDir, { recursive: true });
    await promises_1.default.writeFile(filePath, JSON.stringify(log, null, 2), 'utf-8');
    console.log(`[log] Results written to ${filePath}`);
};
const runTest = (options) => {
    const { title, connections, duration, body } = options;
    const instance = (0, autocannon_1.default)({
        title,
        url,
        method: 'POST',
        connections,
        duration,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }, async (err, result) => {
        if (err) {
            console.error(`[${title}] Test failed:`, err);
        }
        else {
            console.log(`[${title}] Requests per second: ${result.requests.average}`);
            // Pass the title to writeLog through the result object
            result.title = title;
            await writeLog(result);
        }
    });
    autocannon_1.default.track(instance, { renderProgressBar: true });
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
