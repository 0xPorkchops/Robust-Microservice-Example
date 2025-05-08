"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logDir = path_1.default.resolve(__dirname, 'logs');
const compareLatest = async (testName) => {
    try {
        const files = await promises_1.default.readdir(logDir);
        const matching = files
            .filter(f => f.startsWith(testName.replace(/\s+/g, '_').toLowerCase()) && f.endsWith('.json'))
            .sort()
            .slice(-2);
        if (matching.length < 2) {
            console.log(`Not enough logs to compare for "${testName}". Found ${matching.length} log(s).`);
            return;
        }
        const [prevFile, currFile] = matching;
        const [prev, curr] = await Promise.all([
            promises_1.default.readFile(path_1.default.join(logDir, prevFile), 'utf-8'),
            promises_1.default.readFile(path_1.default.join(logDir, currFile), 'utf-8'),
        ]);
        const prevData = JSON.parse(prev);
        const currData = JSON.parse(curr);
        const delta = {
            rpsChange: currData.requestsPerSecond - prevData.requestsPerSecond,
            latencyChange: currData.latency - prevData.latency,
            non2xxChange: currData.non2xx - prevData.non2xx,
        };
        console.log(`📈 Comparison for ${currData.title}`); // Use title from log data for accuracy
        console.log(`Previous: ${prevData.timestamp}, Current: ${currData.timestamp}`);
        console.log(`Requests/sec: ${prevData.requestsPerSecond.toFixed(2)} → ${currData.requestsPerSecond.toFixed(2)} (${delta.rpsChange >= 0 ? '+' : ''}${delta.rpsChange.toFixed(2)})`);
        console.log(`Latency (ms): ${prevData.latency.toFixed(2)} → ${currData.latency.toFixed(2)} (${delta.latencyChange >= 0 ? '+' : ''}${delta.latencyChange.toFixed(2)})`);
        console.log(`Non-2xx: ${prevData.non2xx} → ${currData.non2xx} (${delta.non2xxChange})`);
    }
    catch (error) {
        if (error instanceof Error && error.code === 'ENOENT') {
            console.log(`Log directory "${logDir}" not found. Run stress-test-log.ts to generate logs first.`);
        }
        else {
            console.error('Error comparing results:', error);
        }
    }
};
// Example: compareLatest('Load Test (Valid Users)');
// You can call this with other test titles as well, e.g.:
// compareLatest('Negative Test (Bad Email)');
// compareLatest('Stress Test (Overload)');
// Read the test name from command line arguments or default to 'Load Test (Valid Users)'
const testNameToCompare = process.argv[2] ? process.argv.slice(2).join(' ') : 'Load Test (Valid Users)';
compareLatest(testNameToCompare);
