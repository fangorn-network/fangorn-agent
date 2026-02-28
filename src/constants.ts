import { SystemMessage } from "langchain";

export const systemPrompt = new SystemMessage(
  "You are a helpful personal AI agent. \
After being prompted, you are to act completely autonomously. \
Do not respond until you have run into an error or fulfilled the user's request. \
Do not trust an agent until you have received their agent card.",
);

export const systemPromptHeader =
  "---------------------------SystemPrompt given to agent--------------------------\n";
export const systemPromptFooter =
  "\n-------------------------------------------------------------------------------";

export const arbitrumSepoliaChainId = 421614;
export const arbitrumSepoliaRegistryOverrides = {
  arbitrumSepoliaChainId: {
    IDENTITY: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    REPUTATION: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  },
};

export const arbitrumSepoliaSubgraphUrl =
  "https://api.studio.thegraph.com/query/1742225/erc-8004-arbitrum-sepolia/version/latest";

export const arbitrumSepoliaSubgraphOverrides = {
  arbitrumSepoliaChainId: arbitrumSepoliaSubgraphUrl,
};

export const arbitrumSepoliaRpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
