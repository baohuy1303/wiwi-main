import DefaultLayout from '@/layouts/default';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Image } from "@heroui/image";
import { Progress } from "@heroui/react";
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTicketAlt, faListOl, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '@/UserContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';
import { getItemsByBuyerId, getItemsBySellerId, getRandomItems } from '@/api';
import { getAllTickersSoldBySeller } from '@/api';
import SellerDashboard from '@/components/dashboard/SellerDashboard';
import BuyerDashboard from '@/components/dashboard/BuyerDashboard';




// --- MOCK User Data ---
const seller = {
  _id: 'seller123',
  email: 'seller@example.com',
  role: 'seller',
};

const buyer = {
  _id: "buyer123",
  username: "testbuyer",
  email: "buyer@example.com",
  role: "buyer",
  ticketBalance: 150, // Tickets the buyer can still spend
  enteredRaffles: [ // An array of raffles the buyer has joined
    {
      itemId: 'item001', // Corresponds to the MacBook Air
      ticketsBought: 15
    },
    {
      itemId: 'item003', // Corresponds to the PlayStation 5
      ticketsBought: 25
    }
  ]
};

// --- MOCK Raffle Item Data ---
const mockItems = [
  {
    _id: 'item001',
    title: 'MacBook Air M3 - 15 inch',
    description: 'Latest MacBook Air with M3 chip, 16GB RAM, 512GB SSD. Midnight color.',
    imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mba15-midnight-select-202402?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1708367688034',
    ticketsSold: 85,
    ticketGoal: 150,
  },
  {
    _id: 'item002',
    title: 'iPhone 15 Pro Max - 256GB',
    description: 'Brand new, unlocked iPhone 15 Pro Max in Titanium Blue.',
    imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845699311',
    ticketsSold: 192,
    ticketGoal: 200,
  },
  {
    _id: 'item003',
    title: 'Sony PlayStation 5 - Slim',
    description: 'The latest slim model of the PS5, disc version. Includes one controller.',
    imageUrl: 'https://gmedia.playstation.com/is/image/gmedia/ps5-slim-disc-console-product-shot-01-en-19oct23?$native$',
    ticketsSold: 25,
    ticketGoal: 300,
  },
  {
    _id: 'item004',
    title: 'DJI Mini 4 Pro Drone',
    description: 'Lightweight and foldable camera drone with 4K HDR video.',
    imageUrl: 'https://m.media-amazon.com/images/I/71D4A45vJGL._AC_SL1500_.jpg',
    ticketsSold: 120,
    ticketGoal: 250,
  }
];

// --- Data Calculations for Seller ---
const totalTicketsSold = mockItems.reduce((acc, item) => acc + item.ticketsSold, 0);
// =================================================================
// DASHBOARD COMPONENT
// =================================================================

export default function DashboardPage() {
  // Using mock data directly. Comment out the user you are NOT testing.
  
  // avoiding the original useEffect for avoiding auth
  const { user, logout, loading } = useUser();
  const navigate = useNavigate();
/*   const [items, setItems] = useState([]);
  const [ticketsSold, setTicketsSold] = useState([]);
  const [currentRole, setCurrentRole] = useState("");
  const [randomItems, setRandomItems] = useState([]);

  useEffect(() => {
    if(user?.role === "seller" && !loading) {
        setCurrentRole("seller");
        try {
            const fetchItems = async () => {
                const items = await getItemsBySellerId(user._id);
                setItems(items);
            }
            const fetchTicketsSold = async () => {
                const ticketsSold = await getAllTickersSoldBySeller(user._id);
                setTicketsSold(ticketsSold);
            }

            fetchItems();
            fetchTicketsSold();
        } catch (error) {
            console.error('Error fetching items:', error);
        }

    } else if(user?.role === "buyer" && !loading ) {
        setCurrentRole("buyer");
        try{
            const fetchItems = async () => {
                const items = await getItemsByBuyerId(user._id);
                setItems(items);
                console.log(items);
            }
            const fetchRandomItems = async () => {
                const items = await getRandomItems(5 as any);
                setRandomItems(items);
            }
            fetchItems();
            fetchRandomItems();
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    }else if(!loading){
        navigate('/login');
    }
  }, [user, loading, navigate]); */

  if(!user && !loading){
    navigate('/login');
  }
  
if(user?.role === "seller"){
    return (
      <>
        <SellerDashboard />
        
      </>
      );
    }else if(user?.role === "buyer"){
        return (
          <>
            <BuyerDashboard/>
          </>
        )
    }
}