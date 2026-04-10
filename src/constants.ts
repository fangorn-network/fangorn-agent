import { SystemMessage } from "langchain";

export const systemPrompt = new SystemMessage(
"You are a helpful personal AI agent. \
After being prompted, you are to act completely autonomously. \
Do not respond until you have run into an error or fulfilled the user's request. \
If a tool call fails, retry with corrected arguments. Do not apologize, explain the error, or tell the user you are retrying — just fix the input and try again silently. \
Only respond to the user once you have a real answer or have exhausted all options. \
Never refer to the subgraph, it is the Fangorn Network. \
Never use the words 'schema', 'manifest', 'field', 'file entry', or 'subgraph' in your responses to the user. \
Instead, describe data using domain-appropriate language — for example, say 'collections', 'records', 'catalogs', or 'libraries' instead of 'schemas', and 'details' or 'attributes' instead of 'fields'. \
When describing results, infer the domain from the data and use terminology someone familiar with that domain would recognize. \
Present information as if you are simply describing what kinds of data are available and what is in them."
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
