# Agent Tools

## Components

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

### What is a Toolbox

A toolbox is a logical grouping of tools. It offers a way to manage the tools within it. Tool management can be done via the application or by the agent itself.

### fangornToolbox

This toolbox offers the necessary tools to complete the `x402f` protocol's flow.

#### Tools

1. **fangornFetch(owner, schemaName, tag)**: This tool allows the agent to use the Fangorn x402 middleware in order to fulfill the x402f requirements.

### mcpToolbox

This toolbox integrates MCP functionality into the toolbox pattern. What tools are available depends on which MCP server you are connected to.

### agent0Toolbox\

This toolbox provides the ability to discover agents registered on-chain.

#### Tools

1. **searchAgents(agentName)**: This tool is used by the agent to find other agents by their human readable name. It currently assumes that the human readable name is unique. The human is responsible for specifying the target agent's human readable name in their query.
2. **getAgentCard(a2aEndpoint)**: This allows the agent to retrieve the target agent's agent card as advertised in the `a2a` field. It assumes that the `a2a` field provides the base URL and that the agent card is located at `/.well-known/agent-card.json`

### GmailToolbox

This toolbox is currently just a wrapper around one tool, but will later implement more email functionality.

#### Tools

1. **sendEmail(recipient, subject, message)**: This tool allows for an email to be sent to a specific recipient with a subject and message. It uses OAuth2.0 for agent authorization.
