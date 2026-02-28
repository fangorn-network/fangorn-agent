import { SDK } from "agent0-sdk";

// Arbitrum Sepolia
const chainId = 421614;
const rpcUrl = "https://sepolia-rollup.arbitrum.io/rpc";
const subgraphUrl = "https://gateway.thegraph.com/api/4d3e61e064765d1001ee86baba46a907/subgraphs/id/6WuFQqo3FR5F76fCR4Bkfnymu64S5iu2tgX7JZsxQxg9";
const registryOverrides = {
  chainId: {
    // Retrieved from https://github.com/erc-8004/erc-8004-contracts/blob/master/README.md
    IDENTITY: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    REPUTATION: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  },
};

const subgraphOverrides = {
  chainId: subgraphUrl,
};

// Arbitrum One
// const chainId = 42161;
// const rpcUrl = "https://arb1.arbitrum.io/rpc";
// const subgraphUrl = "https://gateway.thegraph.com/api/61fa508eec436e052c9159527d4c8bb1/subgraphs/id/HZ6yKjjbYpkLTXLJBxfe4HWN3jxkLfLNJXh4zeVj1t9L";
// const registryOverrides = {
//   chainId: {
//     // Retrieved from https://github.com/erc-8004/erc-8004-contracts/blob/master/README.md
//     IDENTITY: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
//     REPUTATION: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
//   },
// };

// const subgraphOverrides = {
//   chainId: subgraphUrl,
// };

const sdk = new SDK({
  chainId,
  rpcUrl,
  subgraphUrl,
  registryOverrides,
  subgraphOverrides,
});

const results = await sdk.searchAgents({ chains: [chainId] });
console.log(
  `Number of agents returned for chain with chainId ${chainId} is ${results.length} `,
  results.length,
);
let ourAgent;
for (const agent of results) {
  if (agent.chainId == 421614) {
    console.log(`${agent.name}`);
    console.log(`endpoints: ${agent.a2a}`);
    console.log(`agentId: ${agent.agentId}`);
    console.log(`chainId: ${agent.chainId}`);

    if (agent.name === "local-testfile-agent") {
      ourAgent = agent;
    }
  }
}

console.log("THIS IS OUR AGENT IN THE ARBITRUM REGISTRY");
console.log(JSON.stringify(ourAgent, null, 2));
