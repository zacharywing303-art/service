import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from '@openfsm/ui';

export default function Home() {
  const { data } = useQuery({ queryKey: ['site-config'], queryFn: () => fetch('/api/site/config').then((r) => r.json()) });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-blue-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{data?.site?.heroTitle || 'Professional HVAC Services'}</h1>
          <p className="text-xl mb-8 text-blue-100">{data?.site?.heroSubtitle || 'Fast, reliable, and affordable.'}</p>
          <div className="flex gap-4 justify-center">
            <Link to="/book"><Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">Book Service</Button></Link>
            <a href={`tel:${data?.company?.phone}`}><Button size="lg" variant="ghost" className="text-white border border-white hover:bg-blue-700">Call {data?.company?.phone}</Button></a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.services?.map((svc: any) => (
              <Card key={svc.id}>
                <h3 className="font-semibold text-lg mb-2">{svc.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{svc.description}</p>
                <p className="text-blue-600 font-bold">From ${svc.price}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About Us</h2>
          <p className="text-gray-600 leading-relaxed">{data?.site?.aboutText}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-white font-bold text-xl mb-2">{data?.company?.name}</div>
          <div>{data?.company?.address}</div>
          <div className="mt-2">{data?.company?.phone} | {data?.company?.email}</div>
          <div className="mt-4 text-sm">Powered by OpenFSM</div>
        </div>
      </footer>
    </div>
  );
}
