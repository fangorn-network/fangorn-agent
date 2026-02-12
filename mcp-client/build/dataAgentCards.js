export const datasourceAgentCards = [
    {
        name: "Weather Agent",
        description: "An agent that provides forecasts based on results from the NSW's API",
        version: "1.0.0",
        supportedInterfaces: [
            {
                url: "http://localhost:3001",
                protocolBinding: "HTTP+JSON",
                protocolVersion: "1.0",
            },
        ],
        capabilities: {},
        defaultInputModes: ["text/plain", "application/json"],
        defaultOutputModes: ["text/plain", "application/json"],
        skills: [
            {
                id: "provide-forecast",
                name: "Provide Forecast",
                description: "Provides a human readable forecast.",
                tags: ["weather", "forecast"],
            },
        ],
        provider: {
            organization: "Fangorn",
            url: "https://fangorn.network",
        },
    },
    {
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
    },
];
