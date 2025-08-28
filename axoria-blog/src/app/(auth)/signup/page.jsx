"use client";

import { useRef } from 'react';
import { register } from "@/lib/serverActions/session/sessionServerActions";
import { useRouter } from 'next/navigation';

export default function page() {
    const serverInfoRef = useRef(null);
    const submitButtonRef = useRef(null);
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault()

        serverInfoRef.current.classList.add("hidden")
        serverInfoRef.current.textContent = ""
        submitButtonRef.current.textContent = "Saving User..."
        submitButtonRef.current.disabled = true

        try {
            const result = await register(new FormData(e.target));
            if (result.success) {
                submitButtonRef.current.textContent = "User created ✅!";
                let countdown = 3

                serverInfoRef.current.classList.remove("hidden")
                serverInfoRef.current.textContent = `Redirecting in ${countdown} seconds...`;

                const interval = setInterval(() => {
                countdown -= 1;

                    serverInfoRef.current.textContent = `Redirecting in ${countdown} seconds...`;
                
                if (countdown === 0) {
                    clearInterval(interval);
                    router.push(`/signin`); // Redirect to the sign-in page
                }
            }, 1000);

        }

    } 
    catch (error) {
        submitButtonRef.current.textContent = "Submit";
        serverInfoRef.current.textContent = error.message;
        submitButtonRef.current.disabled = false;

    }
        
    }

  return (
    <form 
        onSubmit={handleSubmit}
        className='max-w-md mx-auto mt-36'>
        <label 
            htmlFor="userName"
            className='f-label'>Name or pseudo</label>
        <input 
            type="text"
            id="userName"
            name='userName'
            className='f-auth-input'
            placeholder="Name or Pseudo"
            required
        />
        <label 
            htmlFor="email"
            className='f-label'>Email</label>
        <input 
            type="email"
            id="email"
            name='email'
            className='f-auth-input'
            placeholder="Email"
            required
        />
        <label 
            htmlFor="password"
            className='f-label'>Password</label>
        <input 
            type="password"
            id="password"
            name='password'
            className='f-auth-input'
            placeholder="Your Password"
            required
        />
        <label 
            htmlFor="passwordRepeat"
            className='f-label'>Confirm Password</label>
        <input 
            type="password"
            id="passwordRepeat"
            name='passwordRepeat'
            className='f-auth-input'
            placeholder="Confirm Password"
            required
        />
        <button 
            ref={submitButtonRef}
            type="submit"
            className='w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 my-10 rounded border-none'>
                Submit
        </button>
        <p
            ref={serverInfoRef}
            className='hidden text-red-500 text-center mb-10'></p>
        <a 
            href="/signin"
            className='mb-5 underline text-blue-600 block text-center'>
                Already have an account? Log in
        </a>
    </form>
  )
}
