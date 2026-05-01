import { BaseMessage } from "langchain";

export async function promptAgent(model: any, messages: BaseMessage[]) {
		let fullMessage: any | null
    try {
      const stream = await model.stream(messages);
      for await (const chunk of stream) {
        if (!fullMessage) {
          fullMessage = chunk;
        } else {
          fullMessage = fullMessage.concat(chunk);
        }
      }
    } catch (err: any) {
			throw err
    }
		return fullMessage
}