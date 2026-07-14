import axios from 'axios';

export const baseApiToAI = axios.create({
  baseURL: process.env.AI_SERVICE_URL ?? 'http://localhost:5000',
  timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 30000),
  headers: { 'Content-Type': 'application/json' },
});
