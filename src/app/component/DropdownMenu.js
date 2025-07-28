"use client";
import Image from 'next/image';
import { useState, useRef, useEffect } from "react";
import { spotifyLogOut } from './spotifyLogout';

export default function DropdownMenu({ProfilePicture, UserName, UserProduct}) {
const [open, setOpen] = useState(false);
const dropdownRef = useRef();

// Close dropdown when clicking outside
useEffect(() => {
    const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
    }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

return (
    <div className="relative inline-flex" ref={dropdownRef}>
    

    <div className="relative w-10 h-10">
    <Image
        src={ProfilePicture || "/blank_pfp.png"}
        alt="Profile"
        fill
        className="rounded-full object-cover"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Dropdown"
    />  

    </div>

    {open && (
        <div className="absolute right-0 z-10 min-w-40 mt-16 bg-white shadow-md rounded-lg dark:bg-neutral-800 dark:border dark:border-neutral-700">
        <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
            <p className="mb-1 text-sm text-gray-500 dark:text-neutral-400 text-center">Signed in as</p>
            <p className="mb-1 text-sm font-medium text-gray-800 dark:text-neutral-300 text-center">{UserName}</p>
            {UserProduct == "premium" 
            ? <p className="text-sm font-medium text-gray-800 dark:text-neutral-300 text-center">Premium Member</p>
            : <p className="text-sm font-medium text-gray-800 dark:text-neutral-300 text-center">Free Member</p>
            }
        </div>
        <div className="p-1 space-y-0.5">
        <a
            href="#"
            onClick={spotifyLogOut}
            className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
            Log Out
        </a>

        </div>
        </div>
    )}
    </div>
);
}
