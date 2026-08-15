'use client';

import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { MacMenuBar } from '../components/MacMenuBar';
import { RepoIntelligenceMockup } from '../components/RepoIntelligenceMockup';
import { FeatureTriage } from '../components/FeatureTriage';
import { DependencyIntelligenceSection } from '../components/DependencyIntelligenceSection';
import { WorkflowSection } from '../components/WorkflowSection';
import { TrendingRepos } from '../components/TrendingRepos';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { FaqSection } from '../components/FaqSection';
import { FinalCTA } from '../components/FinalCTA';
import { Footer } from '../components/Footer';

export default function Page() {
  const handleAnalyzeRepo = (url: string) => {
    console.log('Analyzing repo:', url);
    const el = document.getElementById('mockup');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white selection:bg-[#3D81E3]/30 font-sans">
      {/* Root SVG Noise Filter */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="c3-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
            <feComposite in2="SourceGraphic" operator="in" result="noise" />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>
        </defs>
      </svg>

      {/* Global Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-80"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
      </div>

      {/* Page guide rails */}
      <div className="hidden xl:block pointer-events-none fixed inset-y-0 left-1/2 w-[72rem] -translate-x-1/2 border-x border-white/10 z-[5]" />

      {/* Page Content */}
      <div className="relative z-10">
        <Navbar />
        <Hero onAnalyze={handleAnalyzeRepo} />
        <MacMenuBar />
        <RepoIntelligenceMockup />
        <FeatureTriage />
        <DependencyIntelligenceSection />
        <WorkflowSection />
        <TrendingRepos onSelectRepo={handleAnalyzeRepo} />
        <Testimonials />
        <Pricing />
        <FaqSection />
        <FinalCTA />
        <Footer />
      </div>
    </div>
  );
}
