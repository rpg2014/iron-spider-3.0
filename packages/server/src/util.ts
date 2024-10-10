export const reverse = (string: any) => {
  return string.split("").reverse().join("");
};

export function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
