"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const pino_1 = __importDefault(require("pino"));
const zod_1 = require("zod");
const envalid_1 = require("envalid");
const env = (0, envalid_1.cleanEnv)(process.env, {
    PORT: (0, envalid_1.port)(),
    NODE_ENV: (0, envalid_1.str)({ choices: ['development', 'production'] }),
});
const app = (0, express_1.default)();
const logger = (0, pino_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
const UserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    age: zod_1.z.number().int().gte(13),
});
app.post('/users', (req, res) => {
    const result = UserSchema.safeParse(req.body);
    if (!result.success) {
        logger.warn({ issues: result.error.issues }, 'Invalid user input');
        res.status(400).json({ error: result.error.format() });
        return;
    }
    const user = result.data;
    logger.info({ user }, 'User created successfully');
    res.status(201).json({ message: 'User created', data: user });
});
app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
});
