
import { GoogleGenAI, Type } from "@google/genai";
import { storageService } from "./storageService";

// Helper to get the AI client instance dynamically
// Prioritizes process.env.API_KEY, falls back to localStorage 'gemini_api_key'
const getAiClient = (): GoogleGenAI | null => {
  try {
    // 1. Primary: Environment Variable
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    
    // 2. Secondary: User Custom Key
    const userKey = storageService.read<string>('gemini_api_key', '');
    if (userKey && userKey.trim().length > 0) {
      return new GoogleGenAI({ apiKey: userKey });
    }
    
    console.warn("Gemini API Key is missing from environment variables and local storage.");
    return null;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    return null;
  }
};

export const aiService = {
  /**
   * Sends a prompt to Gemini 2.5 Flash and returns the text response.
   * Accepts an optional context object to provide user data.
   */
  sendMessage: async (prompt: string, context?: any): Promise<string> => {
    const ai = getAiClient();
    
    if (!ai) {
      return "⚠️ Configuration Error: API Key is missing.\n\nPlease go to **Profile & Settings** and enter your Google Gemini API Key to enable AI features.";
    }

    try {
      let config = {};
      
      // If context is provided, inject it as system instruction
      if (context) {
        const systemInstruction = `
          You are KorteX, a highly intelligent, data-driven, and motivating productivity assistant.
          
          Here is the user's FULL context data:
          ${JSON.stringify(context, null, 2)}
          
          CRITICAL INSTRUCTIONS:
          1. **PERSONALIZATION**: Use the 'detailedActivityLog' to reference specific things the user did (e.g., "I see you studied React yesterday" or "Good job on that 5k run").
          2. **GOAL ALIGNMENT**: Always tie your advice back to their 'primaryGoal' and 'detailedGoal'.
          3. **DISTRACTIONS**: If the user asks about focus, look at 'detailedActivityLog' for distractions and be blunt about the wasted time.
          4. **STATUS**: If they ask "How am I doing?", synthesize the 'weeklyAggregates' and 'detailedActivityLog' to give a comprehensive report.
          5. **TONE**: Be a strict but supportive coach. Use Markdown formatting (bold, lists). Keep responses concise.
        `;
        
        config = { systemInstruction };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: config
      });

      return response.text || "I couldn't generate a response.";
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Handle 401/403 specifically if possible, though the SDK might wrap them
      if (error.toString().includes('401') || error.toString().includes('403') || error.message?.includes('API key')) {
         return "⚠️ Authorization Failed: Your API Key is invalid or expired.\n\nPlease update it in **Profile & Settings**.";
      }
      return "Sorry, I encountered an error communicating with the AI.";
    }
  },

  /**
   * Generates a daily plan based on user context.
   */
  generateDailyPlan: async (contextData: any): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "⚠️ API Key Missing. Please configure it in Settings.";

    const prompt = `
      You are an elite productivity coach. 
      Here is the user's current status and context:
      ${JSON.stringify(contextData, null, 2)}

      Task: Create a structured Daily Plan for today.
      Rules:
      1. Prioritize tasks based on the user's Primary Goal.
      2. Suggest specific times for deep work (Study) vs workouts.
      3. If the user has high distraction time, suggest a dopamine detox.
      4. Be motivating but strict.
      5. Use Markdown formatting (bullet points, bold text).
      6. Keep it under 200 words.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a productivity expert."
        }
      });
      return response.text || "Could not generate plan.";
    } catch (error) {
      console.error("Plan Generation Error:", error);
      return "Failed to generate plan. Please check your API Key.";
    }
  },

  /**
   * Generates a proactive insight based on weekly trends.
   */
  generateProactiveInsight: async (contextData: any): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Configure API Key for insights.";

    const prompt = `
      Analyze the user's weekly trends from this context:
      ${JSON.stringify(contextData.weeklyAggregates || [], null, 2)}
      
      User's Primary Goal: ${contextData.userProfile?.primaryGoal}

      Task: Provide ONE specific, high-impact insight or correlation you found in the last 7 days.
      Examples: 
      - "Your study hours peak on Tuesdays; try to replicate that environment today."
      - "You focus 30% better when you workout in the morning."
      - "Distractions are highest on weekends, consider setting app limits."

      Constraint: Keep it under 30 words. Be proactive and data-driven. Do not be generic.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Keep pushing towards your goals!";
    } catch (error) {
      console.error("Insight Generation Error:", error);
      return "Unable to analyze trends right now.";
    }
  },

  /**
   * Generates a Morning Briefing for the user.
   */
  generateMorningBriefing: async (contextData: any): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Good morning! Please set your API Key to get a personalized strategy.";

    const prompt = `
      You are KorteX, a personal productivity assistant. It is morning.
      
      User: ${contextData.userProfile?.name}
      Primary Goal: ${contextData.userProfile?.primaryGoal}
      Active Tasks: ${contextData.tasks?.active?.length || 0}
      
      Context (Last 7 Days History):
      ${JSON.stringify(contextData.weeklyAggregates || [], null, 2)}

      Task: Generate a "Morning Briefing".
      Structure:
      1. Friendly Greeting.
      2. Snapshot: "You have X tasks today."
      3. Strategy: Look at yesterday's stats. If they slept well, suggest a hard task. If they studied little yesterday, encourage a rebound.
      4. One specific actionable tip for today.

      Tone: Energetic, professional, concise. Max 100 words. Use Markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Good morning! Let's make today productive.";
    } catch (error) {
      console.error("Briefing Generation Error:", error);
      return "Good morning! Let's crush your goals today.";
    }
  },

  /**
   * Breaks down a goal into actionable sub-tasks.
   */
  generateSubTasks: async (goal: string): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) return [];
    if (!goal.trim()) return [];

    const prompt = `
      You are a world-class productivity coach and project manager.
      A user has this high-level goal: "${goal}".

      Break it down into 3-5 smaller, actionable, and concrete tasks that can be completed in a short amount of time (a day or a few days).
      The tasks should be specific and measurable.
      
      Return ONLY a JSON array of strings, where each string is a task description.
      For example: ["Task 1 description", "Task 2 description", "Task 3 description"]
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Goal Decomposition Error:", error);
      return [];
    }
  },

  /**
   * Generates relevant hashtags for journal entries.
   */
  generateJournalTags: async (content: string): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) return [];
    if (!content.trim()) return [];

    const prompt = `
      Analyze this journal entry: "${content}".
      Suggest 3 to 5 relevant, concise hashtags (e.g., #productivity, #react, #mindset).
      Return ONLY a JSON array of strings.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      
      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Journal Tagging Error:", error);
      return [];
    }
  },

  /**
   * Parses natural language input into structured activity logs.
   */
  parseActivityLog: async (input: string): Promise<any[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    const prompt = `
      Extract activity data from this text: "${input}".
      
      Map it to one of these categories: 'study', 'workout', 'wellness', 'sleep', 'distractions'.
      - Study needs 'hours' (number) and 'topic' (string).
      - Workout needs 'mins' (number) and 'type' (string).
      - Wellness needs 'water' (litres, number) OR 'meditation' (mins, number).
      - Sleep needs 'hours' (number). If times are provided (e.g. 11pm to 7am), calculate duration and extract 'startTime'/'endTime'.
      - Distractions needs 'mins' (number) and 'name' (string). (e.g., "wasted 20 mins on instagram").

      Return a JSON array of objects.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: ['study', 'workout', 'wellness', 'sleep', 'distractions'] },
                data: {
                  type: Type.OBJECT,
                  properties: {
                    hours: { type: Type.NUMBER },
                    topic: { type: Type.STRING },
                    mins: { type: Type.NUMBER },
                    type: { type: Type.STRING },
                    water: { type: Type.NUMBER },
                    meditation: { type: Type.NUMBER },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    name: { type: Type.STRING }
                  }
                }
              },
              required: ['category', 'data']
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Smart Log Parsing Error:", error);
      return [];
    }
  },

  /**
   * Parses natural language input into a structured Task.
   */
  parseTaskInput: async (input: string): Promise<{ title: string, description: string, priority: string, category: string, repeating: string } | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    const prompt = `
      Extract task details from this text: "${input}".
      
      Fields:
      - title: The main task action.
      - description: Any extra details provided. Empty string if none.
      - priority: Infer urgency. 'High', 'Medium', or 'Low'. Default to 'Medium'.
      - category: Infer one of 'Work', 'Study', 'Personal', 'Health', 'General'. Default to 'General'.
      - repeating: Infer repetition. 'Daily', 'Weekly', 'Weekdays', or 'None'. Default to 'None'.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
              category: { type: Type.STRING, enum: ['Work', 'Study', 'Personal', 'Health', 'General'] },
              repeating: { type: Type.STRING, enum: ['None', 'Daily', 'Weekly', 'Weekdays'] }
            },
            required: ['title', 'priority', 'category', 'repeating']
          }
        }
      });

      const text = response.text;
      if (!text) return null;
      return JSON.parse(text);
    } catch (error) {
      console.error("Smart Task Parsing Error:", error);
      return null;
    }
  }
};
