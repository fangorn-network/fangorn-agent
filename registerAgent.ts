import { SDK } from "agent0-sdk";

const sdk = new SDK({
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    ipfs: 'pinata',
    pinataJwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1YmE1NTE5MS0yZDNmLTQ3ZGQtYmZlMy0zOTYzMDFjOGRiNzAiLCJlbWFpbCI6ImZhbmdvcm5AZmFuZ29ybi5uZXR3b3JrIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjU0YzZiYzIwYmQxOGJjM2NmYTVhIiwic2NvcGVkS2V5U2VjcmV0IjoiZDc1NzczMjJhZmRkNzBkMTEzNTMyYmE4MjM4ODUzNjZjM2RhM2QzMzg3OTllZjM2YjQxZDhiY2Q1MDYyY2UzMyIsImV4cCI6MTgwMDEzMTEzMH0.qK-Eqw9WuX3iJUDBCmDWmVs7rJQWCeLTc-lylbiowMQ'
    
});

const agent = sdk.createAgent("Fangorn Datasource Agent", "An agent that periodically provides fresh, encrypted, data");

// This will automatically fetch tools, prompts, and resources from the endpoint and populate the agent's capabilities
// await agent.setMCP("")

// This will fetch skills from the A2A agent card
// index capabilities for search
// await agent.setA2A("");

// Agents can advertise their capabilities using the Open Agentic Schema Framework (OASF) taxonomies. 
// This provides standardized classifications for skills and domains, improving discoverability and interoperability.


// reputation, crypto-economic, tee-attestation
agent.setTrust(true, true, true)

agent.setActive(true);

agent.setX402Support(true);

agent.setMetadata({
    version: "1.0.0",
    category: "data-source",
    pricing: "x402f"
})

// const regTx = await agent.registerIPFS();
// await regTx.waitConfirmed();