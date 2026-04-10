import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

const config = [...nextVitals, ...nextTs];

export default config;
