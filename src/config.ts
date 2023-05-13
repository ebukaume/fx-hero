import { config } from 'dotenv';
import { get } from 'env-var';

config();

export const ACCESS_TOKEN = get('ACCESS_TOKEN').required().asString();
export const BOT_TOKEN = get('BOT_TOKEN').required().asString();
export const CHAT_ID = get('CHAT_ID').required().asString();
