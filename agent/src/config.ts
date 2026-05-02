import dotenv from "dotenv";

dotenv.config();

const useGmail = process.env.USE_GMAIL ? process.env.USE_GMAIL === 'true' : false
const useMcp = process.env.USE_MCP ? process.env.USE_MCP === 'true' : false
const useMemory = process.env.USE_MEMORY ? process.env.USE_MEMORY === 'true' : false

console.log(`The agent ${useGmail ? 'will' : 'will not'} use Gmail`)
console.log(`The agent ${useMcp ? 'will' : 'will not'} use MCP tools`)
console.log(`The agent ${useMemory ? 'will use short term memory when called on the tool-scoped-chat endpoint' : 
'will not use short term memory and will not remember any previous interactions in the same session when called on the tool-scoped-chat endpoint'} `)

export const fangornAgentConfig = {
	useGmail,
	useMcp,
	useMemory
}

