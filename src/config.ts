import dotenv from "dotenv";

import { AppConfig, FangornConfig } from "@fangorn-network/sdk";
import { Hex } from "viem";

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

const dataSourceRegistryContractAddress = process.env.DATASOURCE_CONTRACT as Hex

if (!dataSourceRegistryContractAddress) throw new Error("DATASOURCE_CONTRACT env var not set")

const usdcContractAddress = process.env.USDC_CONTRACT as Hex

if (!usdcContractAddress) throw new Error("No usdcContractAddress provided")

const usdcDomainName = process.env.USDC_DOMAIN_NAME

if (!usdcDomainName) throw new Error("no usdcDomainName provided")

const facilitatorAddress = process.env.FACILITATOR_PUBKEY as Hex;

if (!facilitatorAddress) throw new Error("facilitator address not set")

const settlementRegistryContractAddress = process.env.SETTLEMENT_CONTRACT as Hex

if (!settlementRegistryContractAddress) throw new Error("settlement registry contract address not set")

const schemaRegistryContractAddress = process.env.SCHEMA_CONTRACT as Hex

if (!schemaRegistryContractAddress) throw new Error("schem registry contract address not set")

const resourceServerUrl = process.env.RESOURCE_SERVER_URL

if (!resourceServerUrl) throw new Error("resourceServerUrl not defined")

export const appConfig: AppConfig = {
  dataSourceRegistryContractAddress,
  schemaRegistryContractAddress,
  settlementRegistryContractAddress,
  chainName: chainConfig.chainName,
  chain: chainConfig.chain,
  rpcUrl: chainConfig.rpcUrl,
  caip2: chainConfig.caip2
}

export const fangornMiddlewareConfig = {
  privateKey: key,
  config: appConfig,
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
	appConfig,
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

