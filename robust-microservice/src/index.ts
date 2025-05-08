import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { z } from 'zod';
import { cleanEnv, port, str } from 'envalid';

import { ApiResponse, ApiError } from '../types/api';

const env = cleanEnv(process.env, {
  PORT: port(),
  NODE_ENV: str({ choices: ['development', 'production'] }),
});

type Env = typeof env;

const app = express();
const logger = pino();

app.use(express.json());
app.use(helmet());

const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().gte(13),
});

type User = z.infer<typeof UserSchema>;

app.post('/users', (req: Request, res: Response<ApiResponse<User> | ApiError>): void => {
  const result = UserSchema.safeParse(req.body);

  if (!result.success) {
    logger.warn({ issues: result.error.issues }, 'Invalid user input');
    res.status(400).json({ error: result.error.format() });
    return;
  }

  const user: User = result.data;
  logger.info({ user }, 'User created successfully');
  res.status(201).json({ message: 'User created', data: user });
});

app.listen(env.PORT, (): void => {
  logger.info(`Server listening on port ${env.PORT}`);
});