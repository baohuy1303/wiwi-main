// src/pages/signup.tsx

import { useState } from "react"; // 1. Import useState
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/react";
import DefaultLayout from "@/layouts/default";
import { createUser } from "@/api";

export default function SignUpPage() {
  // 2. Add state to track if the user has agreed to the terms
  const [isAgreed, setIsAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try { 
    const userData = { email, password, role };
    const response = await createUser(userData);
    console.log(response);
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Error creating user");
    } finally {
      setLoading(false);
      navigate("/login");
    }
  };


  return (
    <DefaultLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-800/50 backdrop-blur-md rounded-xl shadow-lg border border-slate-700">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white">Create an Account</h1>
            <p className="text-gray-300">Join us and start your journey to winning!</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* ... other input fields ... */}
            {error && <p className="text-red-500">{error}</p>}
            <div>
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                variant="bordered"
                className="text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                variant="bordered"
                className="text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
             <div>
              <Input
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                variant="bordered"
                className="text-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-start">
              <Checkbox
                isSelected={role === "seller"}
                onValueChange={() => setRole(role === "seller" ? "buyer" : "seller")}
                required
              >
                <span className="text-gray-300 text-sm">Seller</span>
              </Checkbox>
              {/* 3. Control the Checkbox component */}
              {/* <Checkbox isSelected={isAgreed} onValueChange={setIsAgreed}>
                <span className="text-gray-300 text-sm">
                  I agree to the{" "}
                  <Link to="#" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </span>
              </Checkbox> */}
            </div>
            {/* 4. Conditionally disable the Button */}
            <Button
              color="primary"
              className="w-full font-bold"
              type="submit"
              disabled={loading}
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>
          <div className="text-center text-gray-400">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}