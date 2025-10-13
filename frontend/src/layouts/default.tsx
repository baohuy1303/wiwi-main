// src/layouts/default.tsx

import { addToast } from '@heroui/toast';
import { useEffect, useState } from 'react'; // 1. Import useState
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/navbar';

// 2. Imports for the Chatbot
import { Button } from "@heroui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots, faXmark } from "@fortawesome/free-solid-svg-icons";
import AIChatWidget from "@/components/AIChatWidget";

export default function DefaultLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { pathname } = useLocation();
    const [isChatOpen, setIsChatOpen] = useState(false); // 3. State for chat

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="relative flex flex-col h-screen">
              <div
                className="fixed inset-0 -z-10"
                style={{
                  background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #350136 100%)",
                }}
              />
            
            <Navbar />

            <main className="container mx-auto max-w-8xl px-6 flex-grow pt-16">
                {children}
            </main>

            {/* --- 4. AI Chatbot Integration --- */}
            <div className="fixed bottom-6 right-6 z-50 group">
                {/* Pulsing effect behind the button */}
                <div className={`absolute inset-0 rounded-full bg-primary blur-md transition-opacity duration-300 ${isChatOpen ? 'opacity-0' : 'opacity-50 group-hover:opacity-80 animate-pulse'}`}></div>
                
                <Button 
                  isIconOnly 
                  className={`relative rounded-full w-14 h-14 text-xl shadow-lg border border-white/10 transition-all duration-300 transform ${isChatOpen ? 'bg-slate-800 text-gray-400 rotate-90 hover:text-white' : 'bg-gradient-to-r from-primary to-secondary text-white hover:scale-110'}`}
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  aria-label="Open AI Chat"
                >
                  <FontAwesomeIcon icon={isChatOpen ? faXmark : faCommentDots} />
                </Button>
            </div>

            {/* The Chat Widget Component */}
            <AIChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
    );
}