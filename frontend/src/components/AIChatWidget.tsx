// src/components/AIChatWidget.tsx

import { useState, useRef, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRobot, faUser, faXmark, faWandMagicSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Image } from '@heroui/image';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// 1. --- DEFINE THE STRUCTURE OF A RAFFLE ITEM ---
// This should match the data sent by your backend
interface RaffleItem {
  _id: string;
  title: string;
  images: string[];
  ticketCost: number;
}

// 2. --- UPDATE THE MESSAGE TYPE ---
// A message can now contain text OR a list of raffle items
type Message = {
  sender: 'user' | 'bot';
  text?: string;
  items?: RaffleItem[];
};

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatWidget({ isOpen, onClose }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Hello! I'm the AI Assistant. Ask me to find a prize, or just say hi!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Use a more descriptive name
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // 3. --- THIS IS THE NEW CORE LOGIC ---
  // Replaces getBotResponse and setTimeout with a real API call
  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Call your Flask backend (running on port 7000)
      const response = await fetch('http://127.0.0.1:8000/agent/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      let botMessage: Message;

      // Create the bot's response message based on the type from the API
      if (data.type === 'items' && data.content.length > 0) {
        // We received a list of items
        botMessage = { sender: 'bot', items: data.content };
      } else if (data.type === 'items' && data.content.length === 0) {
        // The AI searched but found nothing
        botMessage = { sender: 'bot', text: "I couldn't find any raffles that match your search. Try asking for something else!" };
      } else {
        // We received a simple text response
        // Extract text from nested response structure
        const textContent = data.response?.message?.content?.[0]?.text || 
        data.content?.message || 
        data.message || 
        "No response text available";
        botMessage = { sender: 'bot', text: textContent};
      }
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("API call failed:", error);
      const errorMessage: Message = { sender: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again in a moment." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-24 right-6 z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <Card className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 w-[400px] h-[60vh] shadow-2xl shadow-purple-500/20 rounded-2xl overflow-hidden">
        <CardBody className="p-0 flex flex-col h-full relative">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-900/50">
             <div className="flex items-center gap-3">
               <div className='w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30'><FontAwesomeIcon icon={faWandMagicSparkles} className="text-white text-sm" /></div>
               <div>
                 <h3 className="font-bold text-white leading-none">AI Assistant</h3>
                 <p className="text-xs text-green-400 flex items-center gap-1 mt-1"><span className='w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse'/> Online</p>
               </div>
             </div>
             <Button isIconOnly variant="light" size="sm" onClick={onClose} className='text-gray-400 hover:text-white hover:bg-slate-800'><FontAwesomeIcon icon={faXmark} className="text-lg" /></Button>
           </div>
          {/* Chat History */}
          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><FontAwesomeIcon icon={faRobot} className="text-primary text-xs"/></div>}
                
                {/* 4. --- CONDITIONAL RENDERING LOGIC --- */}
                <div className={`max-w-[85%] rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-sm shadow-md shadow-primary/20' : 'bg-transparent'}`}>
                  
                  {/* If the message has text, render the text bubble */}
                  {msg.text && (
                    <div className={`px-3.5 py-2 text-sm leading-relaxed rounded-2xl ${msg.sender === 'user' ? '' : 'bg-slate-800'}`}>
                        <Markdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Style links with proper underlines and colors
                            a: ({children, href}) => (
                              <a 
                                href={href} 
                                className="text-blue-400 hover:text-blue-300 underline decoration-blue-400 hover:decoration-blue-300 transition-colors duration-200"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            // Style paragraphs
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            // Style headings
                            h1: ({children}) => <h1 className="text-lg font-bold text-white mb-2 mt-3 first:mt-0">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-semibold text-white mb-1 mt-2 first:mt-0">{children}</h3>,
                            // Style lists
                            ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({children}) => <li className="text-slate-200">{children}</li>,
                            // Style code
                            code: ({children, className}) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                              ) : (
                                <code className={className}>{children}</code>
                              );
                            },
                            pre: ({children}) => (
                              <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-x-auto mb-2 text-xs">
                                {children}
                              </pre>
                            ),
                            // Style blockquotes
                            blockquote: ({children}) => (
                              <blockquote className="border-l-4 border-blue-400 pl-3 italic text-slate-300 mb-2">
                                {children}
                              </blockquote>
                            ),
                            // Style strong/bold
                            strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                            // Style emphasis/italic
                            em: ({children}) => <em className="italic text-slate-300">{children}</em>,
                          }}
                        >
                          {msg.text}
                        </Markdown>
                    </div>
                  )}

                  {/* If the message has items, render the item cards */}
                  {msg.items && (
                    <div className="space-y-2">
                        <p className="px-1.5 pb-1 text-sm text-gray-300">I found these items for you:</p>
                        {msg.items.map(item => (
                            <Link to={`/raffles/${item._id}`} key={item._id} className="block bg-slate-800/70 hover:bg-slate-700/80 rounded-lg p-2 transition-colors border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <Image src={item.images[0]} alt={item.title} className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-sm text-white line-clamp-1">{item.title}</p>
                                        <p className="text-xs text-primary font-semibold">{item.ticketCost}$ per ticket</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-end gap-2.5"><div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><FontAwesomeIcon icon={faRobot} className="text-primary text-xs"/></div><div className="px-4 py-3 rounded-2xl bg-slate-800 rounded-bl-sm border border-slate-700"><div className="flex items-center space-x-1"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div></div></div></div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
             <form onSubmit={handleSendMessage} className="relative">
               <Input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask for a prize..." className="w-full bg-slate-800" disabled={isLoading} />
               <Button type="submit" isIconOnly className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-8 h-8" disabled={!inputValue.trim() || isLoading}>
                 {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />}
               </Button>
             </form>
           </div>
        </CardBody>
      </Card>
    </div>
  );
}