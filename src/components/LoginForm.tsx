
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      // The error is already handled in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="w-full">
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
        
        <div className="text-right">
          <a href="#" className="text-xs text-gray-400 hover:text-sage">
            Forgot your Password?
          </a>
        </div>
        
        <Button
          type="submit"
          className="w-full bg-sage hover:bg-sage/90 text-white py-6 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
        
        <div className="text-center text-sm text-gray-400">
          Need an account? <Link to="/register" className="text-sage hover:underline">Sign up</Link>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
