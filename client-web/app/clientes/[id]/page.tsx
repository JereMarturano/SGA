'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ClienteRedirectPage() {
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        const id = params.id;
        if (id) {
            router.replace(`/clientes?id=${id}`);
        } else {
            router.replace('/clientes');
        }
    }, [params.id, router]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
}
