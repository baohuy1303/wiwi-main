// src/pages/index.tsx

import LandingLayout from "@/layouts/landing"; // Use the LandingLayout for the index page
import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicketAlt, faGift, faTrophy, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Card, CardHeader } from "@heroui/react";
import { Image } from "@heroui/image";
import { getRandomItems } from "@/api";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import AISearchBar from "@/components/AISearchBar"; // 1. Import the new AI Search Bar component

// --- Mock Data ---
const featuredItems = [
    { id: "item001", title: "MacBook Air M3", imageUrl: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mba13-skyblue-select-202503?wid=892&hei=820&fmt=jpeg&qlt=90&.v=M2RyY09CWXlTQUp1KzEveHR6VXNxcTQ1bzN1SitYTU83Mm9wbk1xa1lWN2h4SGtCQ2R3aStVaDRhL2VUV1NjdkJkRlpCNVhYU3AwTldRQldlSnpRa0lIV0Fmdk9rUlVsZ3hnNXZ3K3lEVlk" },
    { id: "item005", title: "Gucci Marmont Bag", imageUrl: "https://www.purseblog.com/images/2019/06/Gucci-Marmont-Camera-Bag-2-900x675.jpg" },
    
    { id: "item002", title: "iPhone 15 Pro Max", imageUrl: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845699311" },
    { id: "item004", title: "Tesla Model X", imageUrl: "https://wheretoandhow.com/wp-content/uploads/2025/08/Tesla-Model-X-3-1024x576.jpg" },
    
    { id: "item003", title: "PlayStation 5", imageUrl: "https://media.currys.biz/i/currysprod/PS5-Slim-vs-PS5-Header" },
];

export default function IndexPage() {
  const [randomItems, setRandomItems] = useState([]);

  useEffect(() => {
    const fetchRandomItems = async () => {
      const items = await getRandomItems(5);
      setRandomItems(items);
    };
    fetchRandomItems();
  }, []);

  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: horizontalScrollRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-95%"]);

  return (
    <LandingLayout>
      {/* --- HERO SECTION (UPDATED) --- */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center text-white overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="z-10 w-full px-4"
        >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-4 tracking-tighter">
                Could Be Yours...
            </h1>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-12">
                For a Dollar
            </h2>
            <br />
            
            {/* 2. Replace the old <p> and <Button> with the AISearchBar */}
            <AISearchBar />

        </motion.div>
      </section>

      {/* --- HORIZONTAL SCROLLING PRIZES SECTION --- */}
      <section ref={horizontalScrollRef} className="relative h-[300vh] bg-[#000000]">
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <motion.div style={{ x }} className="flex gap-8">
            <div className="flex items-center justify-center pl-24"></div>
            {featuredItems.map((item) => (
              <motion.div 
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className="relative w-[60vh] h-[80vh] flex-shrink-0"
              >
                <Link to={`/raffles/${item.id}`}>
                    <Card className="w-full h-full border-2 border-slate-800 bg-slate-900 group">
                        <CardHeader className="absolute z-10 top-1 flex-col !items-start p-6">
                            <h4 className="text-white font-bold text-3xl drop-shadow-lg">{item.title}</h4>
                        </CardHeader>
                        <Image
                            removeWrapper
                            alt={item.title}
                            className="z-0 w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-500"
                            src={item.imageUrl}
                        />
                    </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- HOW IT WORKS NARRATIVE SECTION --- */}
      <section className="py-24 text-white bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold">The Path to Victory</h2>
          </motion.div>
          
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-1 bg-gradient-to-b from-transparent via-primary to-transparent"></div>
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex justify-start mb-24">
              <div className="w-1/2 pr-12 text-right">
                <FontAwesomeIcon icon={faTicketAlt} className="text-primary text-4xl mb-4" />
                <h3 className="text-3xl font-bold mb-2">1. Discover</h3>
                <p className="text-gray-400">Find a prize that ignites your passion from our hand-picked collection of marvels.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex justify-end mb-24">
              <div className="w-1/2 pl-12 text-left">
                <FontAwesomeIcon icon={faGift} className="text-secondary text-4xl mb-4" />
                <h3 className="text-3xl font-bold mb-2">2. Participate</h3>
                <p className="text-gray-400">Secure your tickets. Each one is a key that could unlock your dream prize.</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex justify-start">
              <div className="w-1/2 pr-12 text-right">
                <FontAwesomeIcon icon={faTrophy} className="text-yellow-400 text-4xl mb-4" />
                <h3 className="text-3xl font-bold mb-2">3. Triumph</h3>
                <p className="text-gray-400">Witness the draw. Winners are notified instantly to claim their victory.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}