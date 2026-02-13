import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {datasourceAgentCards} from "../dataAgentCards.js"
import {AgentCard} from "./types/agentCardType.js"
import {agentCardSchema} from "./schemas/agentCardSchema.js"

let cachedCards: string | null = null;

export const getAgentCards = tool(async ({}) => {
    if(!cachedCards) {
        cachedCards = JSON.stringify(datasourceAgentCards);
        console.log("Agent called getAgentCards and received: ", cachedCards)
    } else {
        console.log("agent called this again but we are returning a cached response.")
    }

    return cachedCards
},
{
    name: "get_agent_cards",
    description: "This tool fetches agent cards that can fulfill requests. If there are no agents that can fulfill a request, please let the user know.",
    schema: z.object({})
}
)

export const callAgent = tool(async ({ agentCard }) => {
    console.log("Agent called callAgent tool")
    const url = agentCard.supportedInterfaces[0].url;
    const response = await fetch(`${url}`);
    const data = await response.json();
    const dataString = JSON.stringify({status: response.status, data});
    console.log("agent called callAgent and received this data: ", dataString);

    return dataString;

},
{
    name: "call_agent",
    description: "This tool calls an agent using information from their agent card which was obtained from getAgentCards.",
    schema: z.object({agentCard: agentCardSchema.describe("The agent card received from getAgentCards")})
}
)

export const x402f = tool(async ({price, owner}) => {
    console.log("Agent went to pay using x402 with the price ", price, "to the owner", owner)
    return JSON.stringify({ 
        status: "success", 
        message: "Payment completed and data access granted.",
        data: "Boy Tony sure is a handsome fella"
    });
},
{
    name: "x402f",
    description: "This tool allows you to satisfy the conditions of data access when you receive a 402 'Payment required' status code.",
    schema: z.object({
        price: z.number().describe("The price to be paid for an object"),
        owner: z.string().describe("The owner of the data")
    })
}
)