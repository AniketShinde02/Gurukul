'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const AuthForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error('Failed to sign in. Please try again.');
      console.error('OAuth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email to verify.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred.');
      console.error('Email sign in/up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledWrapper>
      <div className="form-container">
        <form className="form" onSubmit={handleFormSubmit}>
          <div className="flex-column">
            <label htmlFor="email">Email</label>
          </div>
          <div className="inputForm">
            <svg height={20} viewBox="0 0 32 32" width={20} xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
              </g>
            </svg>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              placeholder="Enter your Email"
              required
              autoComplete="email"
            />
          </div>

          <div className="flex-column">
            <label htmlFor="password">Password</label>
          </div>
          <div className="inputForm">
            <svg height={20} viewBox="-64 0 512 512" width={20} xmlns="http://www.w3.org/2000/svg">
              <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" />
              <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" />
            </svg>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              placeholder="Enter your Password"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          <div className="flex-row">
            <div>
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            {!isSignUp && <span className="span">Forgot password?</span>}
          </div>

          <button className="button-submit" type="submit" disabled={isLoading}>
            {isLoading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>

          <p className="p">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <span className="span" onClick={() => setIsSignUp(!isSignUp)} role="button" tabIndex={0} onKeyPress={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
          
          <div className="college-badge">
            <span className="badge-text">🎓 For College Students Only</span>
          </div>

          <p className="p line">Or With</p>

          <div className="flex-row">
            <button
              type="button"
              className="btn google"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
            >
              <svg width={20} height={20} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <path style={{ fill: '#FBBB00' }} d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256 c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456 C103.821,274.792,107.225,292.797,113.47,309.408z" />
                <path style={{ fill: '#518EF8' }} d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451 c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176z" />
                <path style={{ fill: '#28B446' }} d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512 c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771 c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" />
                <path style={{ fill: '#F14336' }} d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012 c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0 C318.115,0,375.068,22.126,419.404,58.936z" />
              </svg>
              Google
            </button>

            <button
              type="button"
              className="btn github"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234 c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>
        </form>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
    .form-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #1a1a1a;
        padding: 0;
        margin: 0;
    }
    .form {
        display: flex;
        flex-direction: column;
        gap: 15px;
        background-color: #1f1f1f;
        padding: 40px;
        width: 60vw;
        max-width: 500px;
        min-width: 400px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
  ::placeholder {
    font-family: inherit;
    color: #aaa;
  }
  .form button {
    align-self: flex-end;
  }
  .flex-column > label {
    color: #f1f1f1;
    font-weight: 600;
  }
  .inputForm {
    border: 1.5px solid #333;
    border-radius: 10px;
    height: 55px;
    display: flex;
    align-items: center;
    padding-left: 15px;
    padding-right: 15px;
    transition: 0.2s ease-in-out;
    background-color: #2b2b2b;
    width: 100%;
    box-sizing: border-box;
  }
  .inputForm svg path {
    fill: #aaa;
    transition: fill 0.2s ease-in-out;
  }
  .input {
    margin-left: 12px;
    border-radius: 10px;
    border: none;
    width: 100%;
    height: 100%;
    background-color: #2b2b2b;
    color: #f1f1f1;
    font-size: 16px;
    padding: 0;
    outline: none;
  }
  .input:focus {
    outline: none;
  }
  .inputForm:focus-within {
    border: 1.5px solid #2d79f3;
  }
  .inputForm:focus-within svg path {
    fill: #2d79f3;
  }
  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    justify-content: space-between;
  }
  .flex-row > div > label {
    font-size: 14px;
    color: #f1f1f1;
    font-weight: 400;
  }
  .span {
    font-size: 14px;
    margin-left: 5px;
    color: #2d79f3;
    font-weight: 500;
    cursor: pointer;
  }
  .button-submit {
    margin: 20px 0 10px 0;
    background-color: #2d79f3;
    border: none;
    color: white;
    font-size: 15px;
    font-weight: 500;
    border-radius: 10px;
    height: 50px;
    width: 100%;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out, opacity 0.2s;
  }
  .button-submit:hover {
    background-color: #1a66d1;
  }
  .button-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .p {
    text-align: center;
    color: #f1f1f1;
    font-size: 14px;
    margin: 5px 0;
  }
  .line {
    position: relative;
    text-align: center;
  }
  .line::before,
  .line::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background-color: #333;
  }
  .line::before {
    left: 0;
  }
  .line::after {
    right: 0;
  }
  .btn {
    margin-top: 10px;
    width: 100%;
    height: 55px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 500;
    gap: 12px;
    border: 1px solid #333;
    background-color: #2b2b2b;
    color: #f1f1f1;
    cursor: pointer;
    transition: 0.2s ease-in-out;
    font-size: 16px;
  }
  .btn svg {
    fill: currentColor;
  }
  .btn:hover {
    border: 1px solid #2d79f3;
    color: #2d79f3;
  }
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .college-badge {
        display: flex;
        justify-content: center;
        margin: 15px 0;
    }

    .badge-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;

export default AuthForm;
