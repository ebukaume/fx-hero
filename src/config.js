"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAT_ID = exports.BOT_TOKEN = exports.ACCESS_TOKEN = void 0;
const dotenv_1 = require("dotenv");
const env_var_1 = require("env-var");
(0, dotenv_1.config)();
exports.ACCESS_TOKEN = (0, env_var_1.get)('ACCESS_TOKEN').required().asString();
exports.BOT_TOKEN = (0, env_var_1.get)('BOT_TOKEN').required().asString();
exports.CHAT_ID = (0, env_var_1.get)('CHAT_ID').required().asString();
