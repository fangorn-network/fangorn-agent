import { SDK } from "agent0-sdk";
import {
  arbitrumSepoliaChainId,
  arbitrumSepoliaRegistryOverrides,
  arbitrumSepoliaRpcUrl,
  arbitrumSepoliaSubgraphOverrides,
  arbitrumSepoliaSubgraphUrl,
} from "../../../constants.js";

export function getAgent0Sdk(
  config: any,
  privateKey: string,
  pinataJwt: string,
) {
  let agent0Sdk;
  if (config.chain.id === arbitrumSepoliaChainId) {
    agent0Sdk = new SDK({
      chainId: arbitrumSepoliaChainId,
      rpcUrl: arbitrumSepoliaRpcUrl,
      subgraphUrl: arbitrumSepoliaSubgraphUrl,
      registryOverrides: arbitrumSepoliaRegistryOverrides,
      subgraphOverrides: arbitrumSepoliaSubgraphOverrides,
      ipfs: "pinata",
      pinataJwt,
      privateKey,
    });
  } else {
    agent0Sdk = new SDK({
      chainId: config.chain.id,
      rpcUrl: config.chain.rpcUrls.default.http[0],
      ipfs: "pinata",
      pinataJwt,
      privateKey,
    });
  }
  return agent0Sdk;
}
