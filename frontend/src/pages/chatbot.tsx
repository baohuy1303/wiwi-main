// src/components/AIChatWidget.tsx

import { useState, useRef, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRobot, faUser, faXmark, faWandMagicSparkles, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Image } from '@heroui/image';

// --- NEW, MORE POWERFUL TYPE DEFINITIONS ---
interface RaffleItem {
  _id: string;
  title: string;
  images: string[];
  ticketCost: number;
}

// A message can now contain text OR a list of items
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
    { sender: 'bot', text: "Hello! Ask me about our raffles. Try 'show me gaming items' or 'what's the cheapest prize?'" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // --- THIS IS THE CORE LOGIC CHANGE ---
  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Call your actual Flask backend
      const response = await fetch('http://127.0.0.1:7000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentInput }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong with the AI service.');
      }

      const data = await response.json();
      let botMessage: Message;

      // Create the bot's response message based on the type from the API
      if (data.type === 'items' && data.content.length > 0) {
        botMessage = { sender: 'bot', items: data.content };
      } else if (data.type === 'items' && data.content.length === 0) {
        botMessage = { sender: 'bot', text: "I couldn't find any raffles that match your search. Try asking for something else!" };
      } else {
        botMessage = { sender: 'bot', text: data.content };
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

          <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><FontAwesomeIcon icon={faRobot} className="text-primary text-xs"/></div>}
                <div className={`max-w-[85%] rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-sm shadow-md shadow-primary/20' : ''}`}>
                  {/* RENDER TEXT OR ITEMS */}
                  {msg.text && <p className="px-3.5 py-2 text-sm leading-relaxed">{msg.text}</p>}
                  {msg.items && (
                    <div className="p-2 space-y-2">
                        <p className="px-1.5 text-sm">I found these items for you:</p>
                        {msg.items.map(item => (
                            <Link to={`/raffles/${item._id}`} key={item._id} className="block bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-2 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Image src={item.images[0]} alt={item.title} width={60} height={60} className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
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

          <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
            <form onSubmit={handleSendMessage} className="relative">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask for a prize..."
                className="w-full"
                disabled={isLoading}
              />
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