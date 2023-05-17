import { config } from "dotenv";
import { get } from "env-var";

config();

export const META_API_ACCESS_TOKEN = get("META_API_ACCESS_TOKEN")
  .required()
  .asString();
export const TELEGRAM_BOT_TOKEN = get("TELEGRAM_BOT_TOKEN")
  .required()
  .asString();
export const SIGNAL_CHAT_ID = get("SIGNAL_CHAT_ID").required().asString();
export const ACCOUNT_REPORT_CHAT_ID = get("ACCOUNT_REPORT_CHAT_ID")
  .required()
  .asString();
export const ACCOUNT_ID = get("ACCOUNT_ID").required().asString();

export const PAIRS_MAPPING = {
  AUDCADb: 5,
  AUDJPYb: 3,
  AUDUSDb: 5,
  CADJPYb: 3,
  CHFJPYb: 3,
  EURCADb: 5,
  EURJPYb: 3,
  EURUSDb: 5,
  GBPCADb: 5,
  GBPJPYb: 3,
  GBPUSDb: 5,
  NZDCADb: 5,
  NZDJPYb: 3,
  NZDUSDb: 5,
  USDCADb: 5,
  USDJPYb: 3,
};

export type Pair = keyof typeof PAIRS_MAPPING;
export const PAIRS = Object.keys(PAIRS_MAPPING) as unknown as Pair[];
