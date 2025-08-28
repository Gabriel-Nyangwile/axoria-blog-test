"use client";
import Link from "next/link";
import React from "react";
import NavbarDropdown from "./NavbarDropdown";
import { useAuth } from "@/app/AuthContext";
import Image from "next/image";


export default function Navbar() {

  const { isAuthenticated } = useAuth();
  console.log(isAuthenticated);

  return (
    <nav className="z-10 fixed w-full bg-slate-50 border-b border-b-zinc-300">
      <div className="max-w-6xl mx-auto flex py-4 px-12">
        <Link href="/" className="mr-2 text-zinc-900">
          AXORIA
        </Link>
        <Link href="/categories" className="mx-2 text-zinc-900 mr-auto">
          Categories
        </Link>

        {!isAuthenticated.loading && (
          <div>
            <Image
              src="/icons/loader.svg"
              width={24}
              height={24}
              alt=""
            />
          </div>
        )}

        {isAuthenticated.isConnected && (
          <>
            <Link href="/dashboard/create" className="mr-4 text-zinc-900">
              Add an article
            </Link>
            <NavbarDropdown userId={isAuthenticated.userId} />
          </>
        )}
        {!isAuthenticated.isConnected && !isAuthenticated.loading && (
          <>
            <Link href="/signin" className="mx-2 text-zinc-900">
              Sign In
            </Link>
            <Link href="/signup" className="mx-2 text-zinc-900">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
