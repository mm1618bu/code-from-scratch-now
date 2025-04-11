
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await signUp(email, password);
      navigate('/verification');
    } catch (error) {
      console.error('Registration error:', error);
      // The error is already handled in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="w-full">
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs uppercase tracking-wide text-gray-300">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-dark-foreground/20 border-0 text-white rounded focus:ring-0 focus:border-sage h-12"
            placeholder="Enter your email"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="text-xs uppercase tracking-wide text-gray-300">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-dark-foreground/20 border-0 text-white rounded focus:ring-0 focus:border-sage h-12"
            placeholder="Enter your password"
            disabled={isSubmitting}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-6 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            'Register'
          )}
        </Button>
        
        <div className="text-xs text-gray-400 text-center">
          By registering you agree to Sage's <a href="#" className="text-teal-500 hover:underline">Terms of Service</a> and <a href="#" className="text-teal-500 hover:underline">Privacy Policy</a>.
        </div>
        
        <div className="text-center text-sm text-gray-400">
          Already have an account? <Link to="/" className="text-teal-500 hover:underline">Sign in</Link>
        </div>
      </div>
    </form>
  );
};

export default RegisterForm;
