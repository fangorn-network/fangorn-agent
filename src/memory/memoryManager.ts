// import { QdrantVectorStore } from "@langchain/qdrant";
// import { OllamaEmbeddings } from "@langchain/ollama";
// import { Document } from "@langchain/core/documents";

// const COLLECTION_NAME = "agent-memory";

// export class MemoryManager {
//   private store: QdrantVectorStore | null = null;
//   // private embeddings: OllamaEmbeddings;

//   constructor(store: QdrantVectorStore) {
//     // this.qdrantUrl = qdrantUrl;
//     this.store = store;
//   }

//   static async init(ollamaUrl: string, qdrantUrl: string) {
//     // Verify embedding model is reachable
//     const embeddings = new OllamaEmbeddings({
//       model: "nomic-embed-text",
//       baseUrl: ollamaUrl
//     });
//     try {
//       await embeddings.embedQuery("test");
//     } catch (e) {
//       throw new Error(
//         "Embedding model not available. Run: ollama pull nomic-embed-text"
//       );
//     }

//     const store = await QdrantVectorStore.fromExistingCollection(
//       embeddings,
//       {
//         url: qdrantUrl,
//         collectionName: COLLECTION_NAME,
//       }
//     );

//     console.log("Memory store connected");
//     return new MemoryManager(store);
//   }

//   async recall(query: string, k = 3): Promise<string[]> {
//     if (!this.store) throw new Error("MemoryManager not initialized");

//     try {
//       const results = await this.store.similaritySearch(query, k);
//       return results.map((doc) => doc.pageContent);
//     } catch {
//       return [];
//     }
//   }

//   async remember(content: string) {
//     if (!this.store) throw new Error("MemoryManager not initialized");

//     await this.store.addDocuments([
//       new Document({
//         pageContent: content,
//         metadata: { timestamp: new Date().toISOString() },
//       }),
//     ]);
//   }
// }