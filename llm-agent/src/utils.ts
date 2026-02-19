import { z } from "zod";
// Helper to convert JSON Schema to Zod schema (simplified version)
export function jsonSchemaToZod(schema: any): z.ZodTypeAny {
	if (schema.type === "object" && schema.properties) {
		const shape: Record<string, z.ZodTypeAny> = {};
		for (const [key, prop] of Object.entries(schema.properties) as [
			string,
			any,
		][]) {
			let zodType: z.ZodTypeAny;

			switch (prop.type) {
				case "string":
					zodType = z.string();
					if (prop.description) zodType = zodType.describe(prop.description);
					break;
				case "number":
					zodType = z.number();
					if (prop.minimum !== undefined)
						zodType = (zodType as z.ZodNumber).min(prop.minimum);
					if (prop.maximum !== undefined)
						zodType = (zodType as z.ZodNumber).max(prop.maximum);
					if (prop.description) zodType = zodType.describe(prop.description);
					break;
				default:
					zodType = z.any();
			}

			// Make optional if not in required array
			if (!schema.required?.includes(key)) {
				zodType = zodType.optional();
			}

			shape[key] = zodType;
		}
		return z.object(shape);
	}
	return z.any();
}
