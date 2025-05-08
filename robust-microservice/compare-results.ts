import fs from 'fs/promises';
import path from 'path';

const logDir = path.resolve(__dirname, 'logs');

type LogEntry = {
  title: string;
  timestamp: string;
  requestsPerSecond: number;
  latency: number;
  throughput: number;
  non2xx: number;
};

const compareLatest = async (testName: string): Promise<void> => {
  try {
    const files = await fs.readdir(logDir);
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
      fs.readFile(path.join(logDir, prevFile), 'utf-8'),
      fs.readFile(path.join(logDir, currFile), 'utf-8'),
    ]);

    const prevData = JSON.parse(prev) as LogEntry;
    const currData = JSON.parse(curr) as LogEntry;

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

  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`Log directory "${logDir}" not found. Run stress-test-log.ts to generate logs first.`);
    } else {
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