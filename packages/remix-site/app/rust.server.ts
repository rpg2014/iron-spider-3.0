// https://docs.rs/getrandom/latest/getrandom/#webassembly-support
// import { webcrypto } from 'node:crypto'
// globalThis.crypto = webcrypto
export { add, estimate_pi as estimatePi } from "server-rust-functions";
