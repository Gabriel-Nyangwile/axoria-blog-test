"use client"

import React from 'react'
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { logOut, isPrivatePage } from '@/lib/serverActions/session/sessionServerActions';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/AuthContext';

export default function NavbarDropdown ({ userId }) {

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const router = useRouter();
    const { setIsAuthenticated } = useAuth();

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    async function handleLogout(){
       const result = await logOut();

        /* if(!result.success){
            setIsAuthenticated({
                loading: false,
                isConnected: false,
                userId: null
            });
            if(await isPrivatePage(window.location.pathname)){
                router.push('/signin');
            }
        } */
            setIsAuthenticated({
                loading: false,
                isConnected: false,
                userId: null
            });
            router.push('/'); // Redirige toujours vers la home après logout

    }


    function closeDropdown() {
        setIsOpen(false);
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (!dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
        
    }, []);

    return (
        <div 
            ref={dropdownRef}
            className='relative'
        >
            <button
                className='flex'
                onClick={toggleDropdown}
            >
                <Image
                    src="/icons/user.svg"
                    alt=""
                    width={24}
                    height={24}
                ></Image>
            </button>
            {isOpen && (
                <ul
                    className='absolute right-0 top-10 w-[250px] border-b border-x border-zinc-300'
                >
                    <li 
                        className='bg-slate-50 hover:bg-slate-200 border-b border-slate-300'
                        
                    >
                        <Link 
                            href={`/dashboard/${userId}`}className='block p-4'
                            onClick={closeDropdown}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li 
                        className='bg-slate-50 hover:bg-slate-200'
                    >
                        <button 
                            className='w-full p-4 text-left'
                            onClick={handleLogout}
                        >
                            Signout
                        </button>
                    </li>
                    
                </ul>
            )}
        </div>
    )
}
