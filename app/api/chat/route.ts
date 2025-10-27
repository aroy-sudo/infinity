// This file is at app/api/chat/route.ts
// It now calls the OpenAI API (ChatGPT)

import { NextResponse } from 'next/server';

// This is the model we'll use
const OPENAI_MODEL = 'gpt-4o'; // Or "gpt-3.5-turbo"

// In App Router, you export functions named after HTTP methods (GET, POST, etc.)
export async function POST(req: Request) {
  let prompt: string | undefined;
  let apiKey: string | undefined;

  try {
    // 1. Get the request body
    const body = await req.json();
    prompt = body.prompt; // Assign prompt here

    apiKey = process.env.OPENAI_API_KEY; // Assign apiKey here

    console.log("Received prompt:", prompt); // Log received prompt

    if (!prompt) {
      console.error("Prompt is missing in the request body.");
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      console.error("OPENAI_API_KEY is missing from environment variables.");
      return NextResponse.json(
        { error: 'API key is required.' },
        { status: 400 }
      );
    }

    // 2. Build the OpenAI API request
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    const apiRequestBody = {
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: prompt, // Use the assigned prompt variable
        },
      ],
    };

    // *** ADDED LOGGING HERE ***
    console.log("Attempting to fetch OpenAI API...");
    console.log("URL:", apiUrl);
    // Be cautious logging the full body if prompts could be sensitive
    console.log("Request Body (model):", apiRequestBody.model);
    console.log("API Key (first 5 chars):", apiKey ? apiKey.substring(0, 5) + "..." : "Not Found");
    // *** END ADDED LOGGING ***

    // 3. Make the fetch request to OpenAI
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`, // Use the assigned apiKey variable
      },
      body: JSON.stringify(apiRequestBody),
    });

    console.log("Fetch call completed. Status:", response.status); // Log status after fetch

    // Check if the request was successful
    if (!response.ok) {
      const responseText = await response.text();
      console.error('OpenAI API Error Status:', response.status);
      console.error('OpenAI API Error Response Text:', responseText);
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`OpenAI API returned non-JSON error: ${responseText}`);
      }
      throw new Error(
        errorData?.error?.message ||
          `OpenAI API request failed with status ${response.status}`
      );
    }

    // 4. Handle the successful response
    const data = await response.json();
    console.log("OpenAI API Success Response received."); // Log success
    const aiMessage = data?.choices?.[0]?.message?.content;

    if (!aiMessage) {
      console.error('Invalid response structure from OpenAI API:', data);
      throw new Error('Invalid response structure from OpenAI API');
    }

    // 5. Send the response back to the client
    return NextResponse.json({ response: aiMessage });

  } catch (error: any) {
    // Moved variable assignments out to log them even on error
    console.error('Error occurred in API route.');
    console.error('Prompt received:', prompt); // Log prompt again in case of error
    console.error('API Key Found:', !!apiKey); // Log if API key was found
    console.error('Error details:', error.message); // Log the specific error

    // Determine status code based on the error
    let statusCode = 500;
    if (error.message.includes('API key')) {
        statusCode = 400; // Bad request if API key is missing
    } else if (error instanceof SyntaxError) {
        statusCode = 400; // Bad request if JSON parsing failed
    }

    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: statusCode }
    );
  }
}

