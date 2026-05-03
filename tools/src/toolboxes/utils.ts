import { DynamicStructuredTool } from "langchain";

export function getToolsByName(tools: DynamicStructuredTool[], toolNames: string[]): Map<String, DynamicStructuredTool> {
  const matchingToolMap = new Map(
    tools
      .filter((tool) => toolNames.includes(tool.name))
      .map((tool) => [tool.name, tool]),
  );
  return matchingToolMap;
}