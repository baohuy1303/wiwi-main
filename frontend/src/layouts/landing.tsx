// src/layouts/landing.tsx

import { Navbar } from '@/components/navbar';

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex flex-col min-h-screen">
            {/* 
              This is the global background from your DefaultLayout.
              It will now serve as the canvas for our landing page.
            */}
            <div
                className="fixed inset-0 -z-20"
                style={{
                    background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #350136 100%)",
                }}
            />
            
            {/* The glassy navbar will float over the content */}
            <Navbar />

            {/* 
              NO CONTAINER OR PADDING HERE. 
              This is the key change. We render the children directly,
              allowing them to control their own width and layout.
            */}
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}