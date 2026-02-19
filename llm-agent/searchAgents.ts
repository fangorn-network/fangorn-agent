import { SDK } from "agent0-sdk";

const registryOverrides = {421614: {
  // Retrieved from https://github.com/erc-8004/erc-8004-contracts/blob/master/README.md
  IDENTITY: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  REPUTATION: '0x8004B663056A597Dffe9eCcC1965A193B7388713'
}}

const subgraphOverrides = {
  421614: 'https://api.studio.thegraph.com/query/1742225/erc-8004-arbitrum-sepolia/version/latest'
}

const sdk = new SDK({
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    subgraphUrl: 'https://api.studio.thegraph.com/query/1742225/erc-8004-arbitrum-sepolia/version/latest',
    registryOverrides,
    subgraphOverrides
});

const results = await sdk.searchAgents({ chains: [421614] });
console.log(`Number of bots returned for chain Arbitrum Sepolia with chainId 421614 with MCP enabled is ${results.length} `, results.length)
let ourAgent;
  for (const agent of results) {
    if(agent.chainId == 421614) {

      console.log(`${agent.name}`);
      console.log(`endpoints: ${agent.a2a}`)
      console.log(`agentId: ${agent.agentId}`)
      console.log(`chainId: ${agent.chainId}`)

      if(agent.name === "local-testfile-agent") {
        ourAgent = agent;
      }
    }
}

console.log("THIS IS OUR AGENT IN THE ARBITRUM REGISTRY")
console.log(JSON.stringify(ourAgent, null, 2))