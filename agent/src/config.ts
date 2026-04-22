import dotenv from "dotenv";

import { FangornConfig } from "@fangorn-network/sdk";
import { createWalletClient, Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

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

const usdcContractAddress = process.env.USDC_CONTRACT as Hex

if (!usdcContractAddress) throw new Error("No usdcContractAddress provided")

const usdcDomainName = process.env.USDC_DOMAIN_NAME

if (!usdcDomainName) throw new Error("no usdcDomainName provided")

const facilitatorAddress = process.env.FACILITATOR_PUBKEY as Hex;

if (!facilitatorAddress) throw new Error("facilitator address not set")



const resourceServerUrl = process.env.RESOURCE_SERVER_URL

if (!resourceServerUrl) throw new Error("resourceServerUrl not defined")

const walletClient = createWalletClient({
  account: privateKeyToAccount(key),
  chain: chainConfig.chain,
  transport: http(chainConfig.rpcUrl),
})

export const fangornMiddlewareConfig = {
  walletClient: walletClient as any,
  config: chainConfig,
  usdcContractAddress,
  usdcDomainName,
  facilitatorAddress,
  domain
}

export const fangornToolboxConfig = {
  resourceServerUrl
}

export const agent0SdkConfig = {
	pinataJwt,
	chainConfig,
	key
}

const gmailClientId = process.env.GMAIL_CLIENT_ID
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN
const agentSignoff = process.env.AGENT_SIGNOFF;

export const gmailConfig = {
    gmailClientId,
    gmailClientSecret,
    gmailRefreshToken,
    agentSignoff
}

