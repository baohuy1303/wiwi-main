// src/App.tsx

import { Route, Routes } from "react-router-dom";

// Import Layouts
import DefaultLayout from "@/layouts/default";
import LandingLayout from "@/layouts/landing";

// Import Pages
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import SignUpPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import CreateRafflePage from "@/pages/createraffle";
import RaffleDetailPage from "@/pages/raffledetail";
import BrowsePage from "./pages/browse";
import BuyTicketsPage from "./pages/buytickets";
import AIChatbotPage from "@/pages/chatbot"; // 1. Import the new chatbot page

function App() {
  return (
    <Routes>
      {/* --- Landing Page Route --- */}
      <Route 
        path="/" 
        element={
          <LandingLayout>
            <IndexPage />
          </LandingLayout>
        } 
      />

      {/* --- App Routes --- */}
      <Route 
        path="/dashboard" 
        element={
          <DefaultLayout>
            <DashboardPage />
          </DefaultLayout>
        } 
      />
      <Route 
        path="/raffles/new" 
        element={
          <DefaultLayout>
            <CreateRafflePage />
          </DefaultLayout>
        } 
      />
      <Route 
        path="/raffles/:id" 
        element={
          <DefaultLayout>
            <RaffleDetailPage />
          </DefaultLayout>
        } 
      />
      <Route 
        path="/login" 
        element={
          <DefaultLayout>
            <LoginPage />
          </DefaultLayout>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <DefaultLayout>
            <SignUpPage />
          </DefaultLayout>
        } 
      />
      <Route 
        path="/browse" 
        element={
          <DefaultLayout>
            <BrowsePage />
          </DefaultLayout>
        } 
      />
      <Route 
        path="/buytickets" 
        element={
          <DefaultLayout>
            <BuyTicketsPage />
          </DefaultLayout>
        } 
      />

      {/* 2. Add the new route for the chatbot */}
</Routes>
  );
}

export default App;