import dotenv from "dotenv";
import { FangornToolChoices } from "@fangorn-network/agent-tools";

dotenv.config();

const useGmail = process.env.USE_GMAIL
  ? process.env.USE_GMAIL === "true"
  : false;
const useMcp = process.env.USE_MCP ? process.env.USE_MCP === "true" : false;
export const useMemory = process.env.USE_MEMORY
  ? process.env.USE_MEMORY === "true"
  : false;
export const useFangornTools = process.env.USE_FANGORN_TOOLS ? process.env.USE_FANGORN_TOOLS === "true" : false
export const useTasteTools = process.env.USE_TASTE_TOOLS ? process.env.USE_TASTE_TOOLS === "true" : false

console.log(`The agent ${useGmail ? "will" : "will not"} use Gmail`);
console.log(`The agent ${useMcp ? "will" : "will not"} use MCP tools`);
console.log(
  `The agent ${
    useMemory
      ? "will use short term memory when called on the tool-scoped-chat endpoint"
      : "will not use short term memory and will not remember any previous interactions in the same session when called on the tool-scoped-chat endpoint"
  } `,
);

export const fangornToolChoices: FangornToolChoices = {
  useGmail,
  useMcp,
	useFangornTools,
	useTasteTools
};
