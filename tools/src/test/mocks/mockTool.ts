import { DynamicStructuredTool, tool } from "langchain";
import { z } from "zod"

export const mockedToolFoo: DynamicStructuredTool= tool(
      async ({isError, isDisplayData}) => {
				console.log(`mockedToolFoo called and it ${isError ? "should" : "should not"} throw an error.`)
				if (isError) {
					throw new Error("f00bar")
				} else {
					return {"FOO": "bar"}
				}
      },
      {
      	name: "tool_foo",
      	description: "This is the mocked tool foo",
      	schema: z.object({
					isError: z.boolean().describe("This will cause the tool to throw an exception")
			}),
    },
);

export const mockedToolBar: DynamicStructuredTool= tool(
      async ({isError}) => {
				console.log(`mockedToolBar called and it ${isError ? "should" : "should not"} throw an error.`)
				if (isError) {
					throw new Error("foo8ar")
				} else {
					return {"foo": "BAR"}
				}
      },
      {
      	name: "tool_foo",
      	description: "This is the mocked tool foo",
      	schema: z.object({
					isError: z.boolean().describe("This will cause the tool to throw an exception")
			}),
    },
);



