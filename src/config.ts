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
