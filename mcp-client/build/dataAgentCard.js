export const datasourceAgentCard = {
    name: "Data Source Agent",
    description: "An agent that provides data and acts as a data source.",
    version: "1.0.0",
    supportedInterfaces: [
        {
            url: "http://localhost:3000",
            protocolBinding: "HTTP+JSON",
            protocolVersion: "1.0",
        },
    ],
    capabilities: {},
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    skills: [
        {
            id: "provide-data",
            name: "Provide Data",
            description: "Provides data.",
            tags: ["datasource", "data"],
        },
    ],
    provider: {
        organization: "Fangorn",
        url: "https://fangorn.network",
    },
};
