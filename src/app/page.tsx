"use client";

import { Button } from "@/components/ui/button";
import { Wrench, Component, Tv, Zap, MonitorPlay, ArrowRight, Facebook, Instagram, Twitter, Sun, Moon, Monitor } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/theme-context";
import * as React from "react";
// Using the generated image placeholder path - user will need to move this or I will handle the file location.
// For now, I'll refer to it via a local asset path assuming it will be served from public.
// Wait, I should not use the artifact path directly in the src attribute for next/image if it's not in public.
// I will use a class-based background image approach or simple img tag with the artifact path if purely local dev,
// but for a real app, I should move the image to public/*
// I will assume for this step I will reference it as a known abstract background or use a premium dark gradient initially
// and suggest strict placement of the image.
// Actually, I can use the generate_image result. I'll need to move it to public folder to use it.
// I'll add a step to move the file. For this file content, I'll assume it's at /hero-bg.png

export default function Home() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getThemeLabel = () => {
    if (theme === "light") return "Light";
    if (theme === "dark") return "Dark";
    return "System";
  };

  const services = [
    {
      title: "LED Lighting Solutions",
      description: "Premium backlights and LED strips for all major TV brands.",
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      color: "hover:border-yellow-500/50",
      bg: "hover:bg-yellow-500/5",
      href: "/leds"
    },
    {
      title: "TV Software & Firmware",
      description: "Official updates, USB firmware, and system recovery tools.",
      icon: <MonitorPlay className="h-8 w-8 text-blue-500" />,
      color: "hover:border-blue-500/50",
      bg: "hover:bg-blue-500/5",
      href: "#software"
    },
    {
      title: "Repair Services",
      description: "Professional diagnostics and component-level repairs.",
      icon: <Wrench className="h-8 w-8 text-green-500" />,
      color: "hover:border-green-500/50",
      bg: "hover:bg-green-500/5",
      href: "#repair"
    },
    {
      title: "TV Marketplace",
      description: "Buy and sell new, refurbished, and certified used TVs.",
      icon: <Tv className="h-8 w-8 text-purple-500" />,
      color: "hover:border-purple-500/50",
      bg: "hover:bg-purple-500/5",
      href: "#marketplace"
    },
    {
      title: "TV Components",
      description: "Motherboards (Cartes Mères), T-Cons, and Power Boards.",
      icon: <Component className="h-8 w-8 text-red-500" />,
      color: "hover:border-red-500/50",
      bg: "hover:bg-red-500/5",
      href: "#components"
    }
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white selection:bg-primary selection:text-primary-foreground">
      {/* Navbar - Kept consistent but darkened */}
      <header className="fixed top-0 w-full border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-xl z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Tv className="h-5 w-5 text-white" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">TunisiaTVRepair</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Store</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Forum</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleTheme}
              className="h-8 px-2 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title={`Theme: ${getThemeLabel()}`}
            >
              {getThemeIcon()}
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10">Login</Button>
            <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          {/* We will insert the generated image here in CSS or via Image component if available */}
          <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center opacity-30 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-black dark:via-transparent dark:to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white/50 dark:from-black dark:via-transparent dark:to-black/50" />
        </div>

        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 mb-8 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
              The #1 Screen Technology Hub in Tunisia
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              One Platform. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white">
                All Screen Solutions.
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed">
              Whether you need to fix a broken backlight, upgrade your firmware, or buy components for your repair shop. We connect you with the right technology.
            </p>
          </div>

          {/* Service Cards Grid - Floating Overlap */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-8">
            {services.map((service, index) => (
              <Link
                key={index}
                href={service.href}
                className={`group relative p-6 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-opacity-50 transition-all duration-300 backdrop-blur-sm ${service.color} ${service.bg}`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-4 p-3 rounded-xl bg-white/80 dark:bg-black/50 w-fit group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-white/5">
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-grow">
                    {service.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-gray-500 dark:text-white/50 group-hover:text-gray-900 dark:group-hover:text-white transition-colors mt-auto">
                    Explore <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-white/10 py-12">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Tv className="h-5 w-5 text-white" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">TunisiaTVRepair</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your trusted partner for all display technology needs in Tunisia. From components to expert diagnosis.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Store Components</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Community Forum</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Diagnostics Tool</Link></li>
                <li><Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Sell Your TV</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Zone Industrielle, Tunis</li>
                <li>+216 XX XXX XXX</li>
                <li>support@tunisiatvrepair.com</li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <Link href="#" className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link href="#" className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link href="#" className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all">
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-white/10 text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} TunisiaTVRepair. All rights reserved.
          </div>
        </div>
      </footer>

    </main>
  );
}
