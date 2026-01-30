import "dotenv/config";
import { parseEnv } from "@washwise/config";

// Load and validate environment variables
export const env = parseEnv(process.env);

export default env;
