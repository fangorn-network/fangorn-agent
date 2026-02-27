import dotenv from "dotenv";

import { FangornConfig } from "fangorn-sdk";

dotenv.config();

const key = process.env.ETH_PRIVATE_KEY;
if (!key) throw new Error("No private key found");
const envChain = process.env.CHAIN;
console.log("chain: ", envChain);
if (!envChain) throw new Error("No chain specified");
const config =
  envChain == "arbitrumSepolia"
    ? FangornConfig.ArbitrumSepolia
    : FangornConfig.BaseSepolia;
const pinataJwt = process.env.PINATA_JWT;
if (!pinataJwt) throw new Error("No pinataJWT provided");
const pinataGateway = process.env.PINATA_GATEWAY;
if (!pinataGateway) throw new Error("No pinataGateway provided");

const domain = process.env.DOMAIN ? process.env.DOMAIN : "localhost";

export const x402fToolboxConfig = {
  key,
  envChain,
  fangornConfig: config,
  pinataJwt,
  pinataGateway,
  domain,
};

const gmailClientId = process.env.GMAIL_CLIENT_ID
if (!gmailClientId) throw new Error("No gmail client id found")
const gmailClientSecret = process.env.GMAIL_CLIENT_SECRET
if (!gmailClientSecret) throw new Error("No gmail client secret found")
const gmailRefreshToken = process.env.GMAIL_REFRESH_TOKEN
if (!gmailRefreshToken) throw new Error("No gmail refresh token found")

export const gmailConfig = {
    gmailClientId,
    gmailClientSecret,
    gmailRefreshToken
}
