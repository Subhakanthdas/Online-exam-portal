import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`ExamForge API listening at http://127.0.0.1:${port}`);
});

function shutDown(signal) {
  console.log(`${signal} received. Closing server...`);
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => shutDown('SIGINT'));
process.on('SIGTERM', () => shutDown('SIGTERM'));
