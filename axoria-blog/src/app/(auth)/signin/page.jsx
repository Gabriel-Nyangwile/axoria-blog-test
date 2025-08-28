"use client";
import { useRef } from 'react';
import { login } from '@/lib/serverActions/session/sessionServerActions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';

export default function page() {
  const { setIsAuthenticated } = useAuth();
  const serverInfoRef = useRef(null);
  const submitButtonRef = useRef(null);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();

    serverInfoRef.current.textContent = '';
    submitButtonRef.current.disabled = true;
    try {
      const result = await login(new FormData(e.target));
      if (result.success) {
        setIsAuthenticated({
          loading: false,
          isConnected: true,
          userId: result.userId
        });
        router.push('/'); // redirection vers la page d'accueil
        /* router.push(`/dashboard/${result.userId}`);//<-- ici
      } else if (result.success) {
        router.push('/'); // fallback si pas d'userId
      } */
      }
      
    } catch (error) {
      console.log("Error during login:", error);
      submitButtonRef.current.disabled = false;
      serverInfoRef.current.textContent = error.message;
      
    }

  }
  return (
    <form 
      onSubmit={handleSubmit} 
      className='max-w-md mx-auto mt-36'>
        <label 
            htmlFor="userName"
            className='f-label'>Your Pseudo</label>
        <input 
            type="text"
            id="userName"
            name='userName'
            className='f-auth-input'
            placeholder="Your Pseudo"
            required
        />
        <label 
            htmlFor="password"
            className='f-label'>Your Password</label>
        <input 
            type="password"
            id="password"
            name='password'
            className='f-auth-input'
            placeholder="Your Password"
            required
        />
        <button 
            ref={submitButtonRef}
            type="submit"
            className='w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 mt-6 mb-10 rounded border-none'>
                Submit
        </button>
        <p
            ref={serverInfoRef}
            className='text-red-500 text-center mb-10'>
        </p>
        
    </form>
  )
}
