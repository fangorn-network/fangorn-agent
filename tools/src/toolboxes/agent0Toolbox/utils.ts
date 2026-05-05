import { SDK } from "agent0-sdk";
import {
  arbitrumSepoliaChainId,
  arbitrumSepoliaRegistryOverrides,
  arbitrumSepoliaRpcUrl,
  arbitrumSepoliaSubgraphOverrides,
  arbitrumSepoliaSubgraphUrl,
} from "../../constants.js";
import { Agent0SdkToolConfig } from "../../types.js";

export function getAgent0Sdk(agent0SdkToolConfig: Agent0SdkToolConfig) {
  let agent0Sdk;
  if (agent0SdkToolConfig.chainConfig.chain.id === arbitrumSepoliaChainId) {
    agent0Sdk = new SDK({
      chainId: arbitrumSepoliaChainId,
      rpcUrl: arbitrumSepoliaRpcUrl,
      subgraphUrl: arbitrumSepoliaSubgraphUrl,
      registryOverrides: arbitrumSepoliaRegistryOverrides,
      subgraphOverrides: arbitrumSepoliaSubgraphOverrides,
      ipfs: "pinata",
      pinataJwt: agent0SdkToolConfig.pinataJwt,
      privateKey: agent0SdkToolConfig.key,
    });
  } else {
    agent0Sdk = new SDK({
      chainId: agent0SdkToolConfig.chainConfig.chain.id,
      rpcUrl: agent0SdkToolConfig.chainConfig.chain.rpcUrls.default.http[0],
      ipfs: "pinata",
      pinataJwt: agent0SdkToolConfig.chainConfig.pinataJwt,
      privateKey: agent0SdkToolConfig.chainConfig.key,
    });
  }
  return agent0Sdk;
}
