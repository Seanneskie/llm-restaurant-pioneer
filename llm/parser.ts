import { GoogleGenAI, Type } from "@google/genai";
import { CommandSchema, type Command } from "./schema.js";
import { parse } from "path";
import { loadEnv } from "../utils/env.js";

let ai: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!ai) {
    const { GEMINI_API_KEY } = loadEnv();
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}


const CommandResponseSchema = {
  type: "object",
  properties: {
    action: { type: "string", enum: ["search_restaurants"] },
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        near: { type: "string" },
        ll: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
          },
          required: ["latitude", "longitude"],
          additionalProperties: false,
        },
        open_now: { type: "boolean" },
        price: { type: "string", pattern: "^[1-4]$" },
        min_rating: { type: "number" },
        limit: { type: "number" },
        radius_m: { type: "number" }
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  required: ["action", "parameters"],
  additionalProperties: false,
} as const;


const systemPrompt = [
  "You convert a user's request into a JSON command for searching restaurants.",
  "Return ONLY a JSON object that matches this schema:",
].join(" ");



export async function parseToCommand(message: string): Promise<Command> {
  const response = await getAi().models.generateContent({
    model: "gemini-2.5-flash",
    contents: ` ${systemPrompt}
        User Message: ${message},
        `,
    config: {
        responseMimeType: "application/json",
        responseSchema: CommandResponseSchema,
        temperature: 0.0
        }
  });

  
  const text: string | undefined = response.text;
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("No response from AI");
    }

  const json = JSON.parse(text);

  const parsed = CommandSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      "Failed to parse command: " + JSON.stringify(parsed.error.issues)
    );
  }


  return parsed.data;
}
