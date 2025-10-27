'use client';

import { useState, FormEvent } from 'react';

import { Authenticated, Unauthenticated } from 'convex/react'
import { SignInButton, UserButton } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'

export default function Home() {
const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // State for errors

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(''); // Clear previous response
    setError(null); // Clear previous error

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      // *** ADDED LOGGING & ERROR HANDLING HERE ***
      // Log the raw response status
      console.log('API Route Response Status:', res.status);

      // Check if the response status indicates success (e.g., 200 OK)
      if (!res.ok) {
        // If not OK, try to get the error message as text first
        const errorText = await res.text();
        console.error('API Route Error Response Text:', errorText);
        // Throw an error with the text content
        throw new Error(
          `API route failed with status ${res.status}: ${
            errorText || 'No error message provided'
          }`
        );
      }

      // If response is OK, *then* try to parse JSON
      const data = await res.json();
      console.log('API Route Success Response JSON:', data); // Log the parsed JSON

      // Check if the expected 'response' field is in the data
      if (data.response) {
        setResponse(data.response);
      } else {
        // Handle cases where JSON is valid but missing the expected field
        throw new Error(
          'API route returned success status but JSON response is missing the "response" field.'
        );
      }
      // *** END ADDED LOGGING & ERROR HANDLING ***

    } catch (err: any) {
      console.error('Error fetching from API route:', err);
      setError(err.message || 'An unknown error occurred'); // Set the error state
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  return (
    <>

      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
   <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          AI Chat Assistant
        </h1>
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate Response'}
          </button>
        </form>

        {/* Display Error Message */}
        {error && (
          <div
            className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md"
            role="alert"
          >
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {/* Display Response */}
        {response && !error && (
          <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-md">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">
              Response:
            </h2>
            <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
          </div>
        )}
      </div>
    </main>
 
    </>
  );
}

function Content() {
  const messages = useQuery(api.messages.getForCurrentUser)
  return <div>Authenticated content: {messages?.length}</div>
}