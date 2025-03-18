import { createCookie } from "react-router";
import apiKeys from "../.apiKeys.json";

export const oauthTokensCookie = createCookie("x-pg-remix-oauth", {
  maxAge: 604_800, // one week
  secrets: [apiKeys["remix-cookie-secret"]],
  sameSite: "strict",
  httpOnly: true,
  secure: true,
});

export const authSessionCookie = createCookie("x-pg-remix-session", {
  maxAge: 604_800, // one week
  secrets: [apiKeys["remix-cookie-secret"]],
  sameSite: "strict",
  httpOnly: true,
  secure: true,
});
