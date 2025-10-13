// src/components/AISearchBar.tsx

import { useState } from 'react';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faWandMagicSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { Image } from '@heroui/image'; // Import Image for displaying item pictures
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 1. --- DEFINE THE STRUCTURE OF THE DATA WE EXPECT FROM THE AI ---
interface RaffleItem {
  _id: string;
  title: string;
  images: string[];
  ticketCost: number;
}

// The AI can respond with text OR a list of items
type AIResponse = {
  text?: string;
  items?: RaffleItem[];
};

export default function AISearchBar() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // 2. --- STATE TO HOLD THE AI'S FULL RESPONSE (TEXT OR ITEMS) ---
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  // 3. --- ASYNC HANDLER TO CALL YOUR REAL BACKEND ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setAiResponse(null); // Clear previous results

    try {
      const response = await fetch('http://localhost:8000/agent/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!response.ok) {
        throw new Error('Network response failed');
      }

      const data = await response.json();

      // Handle the different types of responses from the backend
      if (data.type === 'items' && data.content.length > 0) {
        setAiResponse({ items: data.content });
      } else if (data.type === 'items' && data.content.length === 0) {
        setAiResponse({ text: "I couldn't find any raffles matching your search. Try asking for something else!" });
      } else {
        // Extract text from nested response structure
        const textContent = data.response?.message?.content?.[0]?.text || 
                           data.content?.message || 
                           data.message || 
                           "No response text available";
        setAiResponse({ text: textContent });
      }

    } catch (error) {
      console.error("AI SearchBar API call failed:", error);
      setAiResponse({ text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : 'scale-100'}`}>
        {/* Decorative glow behind input */}
        <div className={`absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-md transition-opacity duration-300 -z-10 ${isFocused ? 'opacity-60' : 'opacity-30'}`}></div>
        
        <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-full shadow-2xl overflow-hidden">
          <div className="pl-6 text-gray-400">
            <FontAwesomeIcon icon={faWandMagicSparkles} className={`transition-colors duration-300 ${isFocused ? 'text-primary' : ''}`} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask AI: 'Find raffles for electronics under $5'"
            className="w-full bg-transparent text-white text-lg px-4 py-5 focus:outline-none placeholder:text-gray-500"
          />
          <div className="pr-2">
            <Button
              type="submit"
              isIconOnly
              radius="full"
              className={`w-12 h-12 bg-primary text-white transition-all duration-300 ${query.trim() ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}
              disabled={isLoading}
            >
              {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faArrowRight} />}
            </Button>
          </div>
        </div>
      </form>

      {/* 4. --- DYNAMIC RESPONSE AREA --- */}
      <div className={`mt-6 transition-all duration-500 ease-out ${isLoading || aiResponse ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-5 relative overflow-hidden">
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none"></div>
          
          {isLoading && (
            <div className='flex items-center justify-center gap-2 text-gray-400'>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              Thinking...
            </div>
          )}

          {/* This is the magic: Render text OR item cards based on the response */}
          {aiResponse && !isLoading && (
            <div className="animate-fadeIn">
                {/* RENDER TEXT RESPONSE */}
                {aiResponse.text && (
                  <div className="w-full max-w-4xl mx-auto">
                    {/* AI Badge - Centered */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-gradient-to-r from-primary to-secondary rounded-full px-4 py-2 shadow-lg">
                        <span className="text-white text-sm font-bold">AI Assistant</span>
                      </div>
                    </div>
                    
                    {/* Scrollable Message Content */}
                    <div className="max-h-96 overflow-y-auto scrollbar-hide rounded-lg">
                      <div className="prose prose-invert prose-slate max-w-none p-4">
                        <Markdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Style headings
                            h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">{children}</h1>,
                            h2: ({children}) => <h2 className="text-xl font-semibold text-white mb-3 mt-5 first:mt-0">{children}</h2>,
                            h3: ({children}) => <h3 className="text-lg font-semibold text-white mb-2 mt-4 first:mt-0">{children}</h3>,
                            
                            // Style paragraphs
                            p: ({children}) => <p className="text-slate-200 leading-relaxed mb-3 last:mb-0">{children}</p>,
                            
                            // Style lists
                            ul: ({children}) => <ul className="list-disc list-inside text-slate-200 mb-3 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside text-slate-200 mb-3 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="text-slate-200">{children}</li>,
                            
                            // Style code blocks
                            code: ({children, className}) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                              ) : (
                                <code className={className}>{children}</code>
                              );
                            },
                            pre: ({children}) => (
                              <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-3">
                                {children}
                              </pre>
                            ),
                            
                            // Style blockquotes
                            blockquote: ({children}) => (
                              <blockquote className="border-l-4 border-primary/50 pl-4 italic text-slate-300 mb-3">
                                {children}
                              </blockquote>
                            ),
                            
                            // Style tables
                            table: ({children}) => (
                              <div className="overflow-x-auto mb-3">
                                <table className="min-w-full border border-slate-700 rounded-lg">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({children}) => (
                              <th className="border border-slate-700 bg-slate-800 px-4 py-2 text-left text-slate-200 font-semibold">
                                {children}
                              </th>
                            ),
                            td: ({children}) => (
                              <td className="border border-slate-700 px-4 py-2 text-slate-200">
                                {children}
                              </td>
                            ),
                            
                            // Style links
                            a: ({children, href}) => (
                              <a 
                                href={href} 
                                className="text-primary hover:text-primary/80 underline transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            
                            // Style strong/bold
                            strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                            
                            // Style emphasis/italic
                            em: ({children}) => <em className="italic text-slate-300">{children}</em>,
                          }}
                        >
                          {aiResponse.text}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                )}

              {/* RENDER ITEM CARDS */}
              {aiResponse.items && (
                <div>
                  <h3 className="text-center text-xl font-bold mb-4 text-white">Here's what I found for you:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiResponse.items.map(item => (
                      <Link to={`/raffles/${item._id}`} key={item._id} className="block bg-slate-900/50 rounded-lg overflow-hidden group hover:scale-105 hover:border-primary border border-transparent transition-all duration-300">
                        <Image src={item.images[0]} alt={item.title} className="w-full h-40 object-cover" />
                        <div className="p-3">
                          <p className="font-bold text-white truncate group-hover:text-primary transition-colors">{item.title}</p>
                          <p className="text-sm text-gray-400">{item.ticketCost}$ per ticket</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}