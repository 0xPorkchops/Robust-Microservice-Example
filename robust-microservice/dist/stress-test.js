"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autocannon_1 = __importDefault(require("autocannon"));
const url = 'http://localhost:3000/users';
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
    }, (err, result) => {
        if (err) {
            console.error(`[${title}] Test failed:`, err);
        }
        else {
            console.log(`[${title}] Test complete. Requests per second: ${result.requests.average}`);
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
