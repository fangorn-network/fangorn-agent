import dotenv from "dotenv";
import { Agent0SdkToolConfig, FangornAgentToolConfig, FangornToolConfig, GmailToolConfig, McpServerConfig } from "@fangorn-network/agent-tools";
import { FangornConfig } from "@fangorn-network/sdk";
import { createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const useGmail = process.env.USE_GMAIL
  ? process.env.USE_GMAIL === "true"
  : false;
const useAgent0 = process.env.USE_AGENT0 ? process.env.USE_AGENT0 === "true" : false;
const useMcp = process.env.USE_MCP ? process.env.USE_MCP === "true" : false;
const mcpServerUrls = process.env.FANGORN_MCP_URL ? [process.env.FANGORN_MCP_URL] : [""]
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

const key = process.env.ETH_PRIVATE_KEY as Hex;
if (!key) throw new Error("No private key found");

const envChain = process.env.CHAIN;
console.log("chain: ", envChain);
if (!envChain) throw new Error("No chain specified");
const chainConfig =
  envChain == "arbitrumSepolia"
    ? FangornConfig.ArbitrumSepolia
    : FangornConfig.BaseSepolia;
const pinataJwt = process.env.PINATA_JWT;
if (!pinataJwt) throw new Error("No pinataJWT provided");
const pinataGateway = process.env.PINATA_GATEWAY;
if (!pinataGateway) throw new Error("No pinataGateway provided");

const domain = process.env.DOMAIN ? process.env.DOMAIN : "localhost";

const usdcContractAddress = process.env.USDC_CONTRACT as Hex;

if (!usdcContractAddress) throw new Error("No usdcContractAddress provided");

const usdcDomainName = process.env.USDC_DOMAIN_NAME;

if (!usdcDomainName) throw new Error("no usdcDomainName provided");

const facilitatorAddress = process.env.FACILITATOR_PUBKEY as Hex;

if (!facilitatorAddress) throw new Error("facilitator address not set");

const resourceServerUrl = process.env.RESOURCE_SERVER_URL;

if (!resourceServerUrl) throw new Error("resourceServerUrl not defined");

const walletClient = createWalletClient({
  account: privateKeyToAccount(key),
  chain: chainConfig.chain,
  transport: http(chainConfig.rpcUrl),
});

export const fangornToolConfig: FangornToolConfig = {
	enabled: useFangornTools,
  walletClient: walletClient as any,
  config: chainConfig,
  usdcContractAddress,
  usdcDomainName,
  facilitatorAddress,
	resourceServerUrl,
  domain,
};

export const agent0SdkToolConfig: Agent0SdkToolConfig = {
	enabled: useAgent0,
  pinataJwt,
  chainConfig,
  key,
};

const gmailClientId = process.env.GMAIL_CLIENT_ID ?? "";
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET ?? "";
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN ?? "";
const agentSignoff = process.env.AGENT_SIGNOFF ?? "";

const gmailConfig: GmailToolConfig = {
	enabled: useGmail,
  gmailClientId,
  gmailClientSecret,
  gmailRefreshToken,
  agentSignoff,
};

const mcpServerConfig: McpServerConfig = {
	enabled: useMcp,
	mcpServerUrls
}

export const fangornAgentToolConfig: FangornAgentToolConfig = {
	gmailConfig,
	agent0SdkToolConfig,
	fangornToolConfig,
	mcpServerConfig,
	useTasteTools
}