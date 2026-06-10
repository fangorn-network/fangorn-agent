import { LLMProvider } from "@fangorn-network/agent-types";
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "langchain";

// medium is currently unused
const MEMORY_BUDGETS: Record<LLMProvider, number> = {
  [LLMProvider.Ollama]: 1024, // 4B and under
  [LLMProvider.Anthropic]: 16384, // 70B+ or API models like Claude
};

export class FangornSTM {
  private shortTermMemory: BaseMessage[];
  private memoryBudget: number;
  private newMessagesIndex: number;

  constructor(llmProvider: LLMProvider, memoryBudget?: number) {
    this.shortTermMemory = [];
    this.memoryBudget = memoryBudget ?? MEMORY_BUDGETS[llmProvider];
    this.newMessagesIndex = -1;
  }

  public updateSTM(messages: BaseMessage[]) {
    const newMessages = messages.slice(this.newMessagesIndex);
    this.shortTermMemory.push(...this.sanitizeForSTM(newMessages));
    this.trimShortTermMemory();
  }

  public trimShortTermMemory(): void {
    let total = 0;

    for (let i = this.shortTermMemory.length - 1; i >= 0; i--) {
      const content =
        typeof this.shortTermMemory[i].content === "string"
          ? (this.shortTermMemory[i].content as string)
          : JSON.stringify(this.shortTermMemory[i].content);
      const estimate = Math.ceil(content.length / 4);

      if (total + estimate > this.memoryBudget) {
        // Drop everything before index i+1
        this.shortTermMemory = this.shortTermMemory.slice(i + 1);
        return;
      }
      total += estimate;
    }
  }

  public getInitialSTM(
    systemMessage: SystemMessage,
    userMessage: HumanMessage,
  ) {
    const initialMessages = [
      systemMessage,
      ...this.shortTermMemory,
      userMessage,
    ];
    this.newMessagesIndex = initialMessages.length;
    return initialMessages;
  }

  public sanitizeForSTM(msgs: BaseMessage[]): BaseMessage[] {
    return msgs.map((msg) => {
      const type = msg.type;

      if (type === "ai") {
        const kwargs = (msg as any).kwargs ?? (msg as any);
        const additional = kwargs.additional_kwargs;

        if (additional) {
          delete additional.reasoning_content;
          delete additional.response_metadata;
          delete additional.tool_call_chunks;
          delete additional.usage_metadata;
        }

        if (kwargs.response_metadata) {
          kwargs.response_metadata = {};
        }

        // These are top-level kwargs fields
        delete kwargs.tool_call_chunks;
        delete kwargs.usage_metadata;
      }

      if (type === "tool") {
        const content = (msg as ToolMessage).content;
        if (typeof content === "string") {
          (msg as any).content = this.truncateToolContent(content);
        }
      }

      return msg;
    });
  }

  private truncateToolContent(content: string, maxLen: number = 500): string {
    if (content.length <= maxLen) return content;

    const firstLine = content.split("\n")[0];
    if (firstLine.length <= maxLen) {
      return firstLine + "\n[Full results were shown to user in UI]";
    }

    return content.slice(0, maxLen) + "... [truncated]";
  }
}
