"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('nexo_access');
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/home');
    }
  }, [router]);

  return null;
}