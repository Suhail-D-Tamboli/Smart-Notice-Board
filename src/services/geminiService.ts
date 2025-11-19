import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with your API key
// You'll need to set VITE_GEMINI_API_KEY in your .env file
// @ts-ignore
const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || '';
console.log('Gemini Service: API Key exists:', !!API_KEY);
console.log('Gemini Service: API Key length:', API_KEY.length);

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

interface Notice {
  _id: string;
  title: string;
  description: string;
  date: string;
  semester?: string;
  department?: string;
  createdBy: string;
  createdAt: string;
}

export async function generateChatResponse(userQuery: string, notices: Notice[]): Promise<string> {
  try {
    console.log('Gemini Service: Received request with', notices.length, 'notices');
    console.log('Gemini Service: User query:', userQuery);
    console.log('Gemini Service: Notices:', notices);
    console.log('Gemini Service: genAI object:', genAI);

    // If no API key is provided, return a simulated response
    if (!genAI) {
      console.log('Gemini Service: No API key found, returning simulated response');
      const fallbackResponse = generateFallbackResponse(userQuery, notices);
      console.log('Gemini Service: Fallback response:', fallbackResponse);
      return fallbackResponse;
    }

    // Create context from notices
    let context = "Available campus notices:\n";
    if (notices.length === 0) {
      context += "No notices available at the moment.\n";
    } else {
      notices.slice(0, 5).forEach((notice, index) => {
        context += `${index + 1}. Title: "${notice.title || 'Untitled'}"\n`;
        context += `   Date: ${notice.date ? new Date(notice.date).toLocaleDateString() : 'Unknown'}\n`;
        context += `   Posted by: ${notice.createdBy || 'Unknown'}\n`;
        context += `   Description: ${notice.description || 'No description'}\n\n`;
      });
    }

    // Create the prompt for Gemini
    const prompt = `
You are a helpful campus notice board assistant. A student has asked: "${userQuery}"

Here is the context of available notices:
${context}

Please provide a helpful, conversational response that:
1. Directly addresses the student's question
2. References relevant notices when applicable
3. Uses a friendly, helpful tone
4. If multiple notices are relevant, summarize them clearly
5. If no notices match, suggest what the student might ask instead

Response:
`;

    console.log('Gemini Service: Sending prompt to API:', prompt);

    // Try different model names that are known to work
    const modelNames = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro"];
    let result;
    let lastError: any;
    
    for (const modelName of modelNames) {
      try {
        console.log(`Gemini Service: Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        console.log(`Gemini Service: Successfully used model: ${modelName}`);
        break;
      } catch (error: any) {
        console.log(`Gemini Service: Failed to use model ${modelName}:`, error.message);
        lastError = error;
      }
    }
    
    if (!result) {
      console.log('Gemini Service: All models failed, returning fallback response');
      console.log('Gemini Service: Last error:', lastError);
      const fallbackResponse = generateFallbackResponse(userQuery, notices);
      console.log('Gemini Service: Fallback response:', fallbackResponse);
      return fallbackResponse;
    }
    
    const response = result.response.text();
    console.log('Gemini Service: Received response from API:', response);
    
    // Check if the response contains the error message
    if (response.includes("I'm having trouble processing your request right now")) {
      console.log('Gemini Service: API returned error message, using fallback response');
      const fallbackResponse = generateFallbackResponse(userQuery, notices);
      console.log('Gemini Service: Fallback response:', fallbackResponse);
      return fallbackResponse;
    }
    
    return response;
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    console.log('Gemini Service: Caught error, returning fallback response');
    const fallbackResponse = generateFallbackResponse(userQuery, notices);
    console.log('Gemini Service: Fallback response:', fallbackResponse);
    return fallbackResponse;
  }
}

// Enhanced fallback response generator
function generateFallbackResponse(userQuery: string, notices: Notice[]): string {
  // Simple keyword-based response generator
  const lowerQuery = userQuery.toLowerCase();
  
  // Filter notices based on keywords in the query
  const relevantNotices = notices.filter(notice => {
    const title = (notice.title || '').toLowerCase();
    const description = (notice.description || '').toLowerCase();
    const createdBy = (notice.createdBy || '').toLowerCase();
    
    // Check if any word in the query matches the notice content
    const queryWords = lowerQuery.split(' ').filter(word => word.length > 2);
    return queryWords.some(word => 
      title.includes(word) || 
      description.includes(word) || 
      createdBy.includes(word) ||
      (notice.date && notice.date.includes(word))
    );
  });
  
  // If we found relevant notices, provide a summary
  if (relevantNotices.length > 0) {
    let response = `I found ${relevantNotices.length} notice${relevantNotices.length > 1 ? 's' : ''} related to "${userQuery}":\n\n`;
    
    relevantNotices.slice(0, 3).forEach((notice, index) => {
      response += `${index + 1}. ${notice.title || 'Untitled'}\n`;
      response += `   Date: ${notice.date ? new Date(notice.date).toLocaleDateString() : 'Unknown'}\n`;
      response += `   Posted by: ${notice.createdBy || 'Unknown'}\n`;
      if (notice.description) {
        // Truncate description for brevity
        const truncatedDesc = notice.description.length > 100 
          ? notice.description.substring(0, 100) + '...' 
          : notice.description;
        response += `   Description: ${truncatedDesc}\n`;
      }
      response += '\n';
    });
    
    if (relevantNotices.length > 3) {
      response += `... and ${relevantNotices.length - 3} more notices.\n\n`;
    }
    
    response += "For more details, please check the notices section above.";
    return response;
  }
  
  // If no specific notices found, provide general guidance
  let response = `I couldn't find any specific notices related to "${userQuery}".\n\n`;
  response += "Here are some suggestions:\n";
  response += "- Try asking about 'library', 'exams', 'sports', or 'events'\n";
  response += "- Check the notices and events sections above\n";
  response += "- Be more specific with your query\n\n";
  
  if (notices.length > 0) {
    response += `Currently, there ${notices.length > 1 ? 'are' : 'is'} ${notices.length} notice${notices.length > 1 ? 's' : ''} available in total:\n\n`;
    
    // List all notices briefly
    notices.slice(0, 5).forEach((notice, index) => {
      response += `${index + 1}. ${notice.title || 'Untitled'} (${notice.date ? new Date(notice.date).toLocaleDateString() : 'Unknown date'})\n`;
    });
    
    if (notices.length > 5) {
      response += `... and ${notices.length - 5} more notices.`;
    }
  } else {
    response += "There are currently no notices available.";
  }
  
  return response;
}
