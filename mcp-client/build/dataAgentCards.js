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
        name: "Game Data Source Agent",
        description: "An agent that sells video games.",
        version: "1.0.0",
        supportedInterfaces: [
            {
                url: "http://localhost:3000/games",
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
                tags: ["datasource", "data", "Tony"],
            },
        ],
        provider: {
            organization: "Fangorn",
            url: "https://fangorn.network",
        },
    },
    {
        name: "Music Data Source Agent",
        description: "An agent that sells music.",
        version: "1.0.0",
        supportedInterfaces: [
            {
                url: "http://localhost:3000/music",
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
                tags: ["datasource", "data", "music"],
            },
        ],
        provider: {
            organization: "Fangorn",
            url: "https://fangorn.network",
        },
    },
];
