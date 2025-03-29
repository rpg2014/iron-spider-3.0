import { createCookie } from "react-router";
import apiKeys from "../../../.api_keys.json";
import { REMIX_COOKIE_SECRET } from "../../../.secrets";

export const authSessionCookie = createCookie("x-pg-remix-session", {
  maxAge: 604_800, // one week
  secrets: [apiKeys["remix-cookie-secret"], REMIX_COOKIE_SECRET],
  sameSite: "strict",
  httpOnly: true,
  secure: true,
});

export const oauthStateCookie = createCookie("x-pg-remix-oauth-state", {
  maxAge: 360, // 5 mins
  secrets: [apiKeys["remix-cookie-secret"], REMIX_COOKIE_SECRET],
  sameSite: "strict",
  httpOnly: true,
  secure: true,
});
