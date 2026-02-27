# Fangorn Agent

##### Note: This project is still in active development and subject to change.

### About
The Fangorn Agent is an experiment in personal agent development. Currently, the top models for agent development are ChatGPT and Claude. However, these models are extremely expensive to run and do not really fit into the "personal" portion of a personal agent. Therefore, the Fangorn Agent is first and foremost meant to be able to run on consumer grade hardware. 

We are also aiming to create a personal agent that can only do what you *allow* it to do. This is simple via the use of tools versus the use of skills (although skill support is provided by LangChain as well). From the perspective of the agent, it has access to many different black boxes that allow it to accomplish tasks without revealing *how* the tasks are completed or if sensitive information was involved. 

To learn more about the initial development and the context in which it was built, please refer to our [HackMD](https://hackmd.io/@Y5vcBYL4SyeRG_CqQq0DoQ/Hk0lPGbOZx) article discussing our Arbitrum Open house project.

### Stack
- LangChain
- Ollama
- Typescript

### Computer Spec information:
This agent is intended to be run on consumer grade hardware, but even so the current `glm-4.7-flash` model is quite heavy. These are the specs of a computer that can run the agent with that model:

- Form factor: Full Tower
- OS: Ubuntu 24.04.3 LTS
    - Kernel Version: Linux 6.17.0-14-generic
- GPU: NVIDIA GeForce RTX™ 2080 Ti
- CPU: AMD Ryzen™ 9 9900X × 24
- RAM: 32 GB DDR5
- Storage: Samsung 970 EVO NVMe SSD 500 GB

## Pre-reqs:

1. Ensure ollama is installed `curl -fsSL https://ollama.com/install.sh | sh` and that the `glm-4.7-flash` model is installed `ollama pull glm-4.7-flash`
    - A lighter model that can be used, but may be unreliable is `qwen3:8b`
2. Ensure you have `pnpm` installed
3. Ensure the facilitator and resource server in the x402f project are running
4. Ensure you have OAuth2.0 tokens created for the gmail address you wish to use
5. Run `cp env.example .env` and fill in the information

## To run

1. Run `pnpm i` at the root of the project
2. Run `npm run dev`

## Components

### index.ts

This is the entry point for chat loop. Here, the agent is created and the user interaction loop begins.

### FangornAgent.ts

This is the agent and where the agent loop runs, via `invokeAgent()`, and the `Toolbay` is initialized.

### toolbay.ts

This is where tools are created, tool invocation occurs, and hotswapping tools happens.

### types.ts
This contains two interfaces and a factory function:
1. `Toolboxes`: This interface enables tools to be grouped under a broader category. A toolbox exposes two functions:
    - `getTools()`: this returns all of the tools that are in the toolbox.
    - `getToolboxAsTool()`: this returns the toolbox as a callable tool itself. This primes the model to re-plan when a tool hotswap is going to occur. It also enables us to perform the hotswap itself.
2. `AsyncFactory<T>`: This interface ensures that Toolboxes implement a static init function. This allows for tools with asynchronous dependencies to be created (see `x402fToolbox.ts`)
3. `initializeToolbox()`: This function is used by the toolbay to create the toolboxes and their tools.

## Toolboxes
### Why a Toolbox
When building the intial agent for the Arbitrum hackathon, it was noted that when a smaller LLM receives too many tools, it seems to get "confused" and "forgets" how to call tools. One solution we are exploring is "compressing" the tool context by introducing Toolboxes. 

### What is a Toolbox
Simply put, a Toolbox is a way to expose to an agent that it has access to many more tools without overloading it with those tools itself.

### How does it work
The Toolbox and ToolBay work in conjunction with each other to enable "hotswapping" tools. You can see that we do not use the typical `createAgent` function offered by LangChain, but instead use the model directly. This is because once an agent is created via `createAgent`, there is no way to hotswap tools outside of re-creating the agent. However, the models do expose a function called `bindTools` which allows for the available tools to be updated for a model directly. We, therefore, expose the agent loop and check if the agent intends to use tools. 

If tool usage is intended, we intercept the tool call and check if it is calling a Toolbox. If it is, we update the `currentTools` field in the ToolBay with the tools within the specified toolbox, and then allow the Toolbox "tool" to be called directly by the agent. The Toolbox tool simply returns a response to the agent to let it know that it has new tools available and that it should re-plan with these new tools. When the agent event loop goes back to the top, we check if the toolbay is marked as "dirty" (new tools are available), if it is we re-bind the tools to the model.

### x402fToolbox
This toolbox offers the necessary tools to complete the `x402f` protocol's flow. The tools themselves were created during the 2026 Arbitrum Open house, but the Toolbox is new.

Here is the "tool" that is returned by the `getToolboxAsTool` function:
```
const fangornAgentToolboxTool = tool(
      async () => {
        return JSON.stringify({
          status: 200,
          statusText: "OK",
          result:
            "Agent tools are now available. You now have access to: search_agents, get_agent_card, call_x402f_agent. Re-plan and use them to complete the task.",
        });
      },
      {
        name: this.name,
        description:
          "Access agent tools for searching agents, retrieving agent cards, and calling x402f-enabled agents. Call this first before attempting any agent related tasks.",
        schema: z.object({}),
      },
    );
```

You can see that it doesn't actually *do* anything other than let the agent know that it has new tools. The magic really occurs because the tools have already been updated, the toolbay is marked as dirty, and this response is returned causing the agent loop to start from the beginning with the dirty toolbay.

#### Tools

1. **searchAgents(agentName)**: This tool is used by the agent to find other agents by their human readable name. It currently assumes that the human readable name is unique. The human is responsible for specifying the target agent's human readable name in their query.
2. **getAgentCard(a2aEndpoint)**: This allows the agent to retrieve the target agent's agent card as advertised in the `a2a` field. It assumes that the `a2a` field provides the base URL and that the agent card is located at `/.well-known/agent-card.json`
3. **callx402fAgent(agentName, tag, agentCardUrl, owner)**: This tool allows the agent to use the x402f middleware in order to fulfill the x402f requirements. The human is responsible for providing the filename (tag) for the agent in their query.

### GmailToolbox
This toolbox is currently just a wrapper around one tool, but will later implement more email functionality.

#### Tools

1. **sendEmail(recipient, subject, message)**: This tool allows for an email to be sent to a specific recipient with a subject and message. It uses OAuth2.0 for agent authorization.

### searchAgents.ts

Agent lookup on Arbitrum Sepolia via the agent-0 sdk
`npm run search`


# TODOs:
1. When an agent calls a toolbox, it gets back ALL of the tools in the toolbox. We should investigate a way to minimize the amount of tools returned by a toolbox. One idea may be that the agent requests a specific tool from the toolbox instead of getting them all.
2. The LLM currently runs in the same environment as the tools themselves. Although we do not give direct filesystem access, it would be best if we could further isolate the model in a docker container to minimize exposing sensitive info that may be on the computer.
3. Integrate MCP server/client architecture into the toolbay. This will allow for an agent to connect to a remote MCP server and use the tools provided by it.
4. Right now all of our toolboxes are included. We should consider using `clack` to allow for a user to select what toolboxes they would like to include before starting the agent.
