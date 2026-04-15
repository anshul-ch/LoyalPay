import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-brand-navy via-brand-navy-dark to-[#001520]">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-24 -right-20 w-72 h-72 bg-brand-red/20 blur-3xl rounded-full"></div>
        <div class="absolute top-80 -left-20 w-72 h-72 bg-brand-orange/20 blur-3xl rounded-full"></div>
      </div>

      <!-- Header -->
      <header class="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">LP</span>
          </div>
          <span class="font-bold text-white text-xl">LoyalPay</span>
        </div>
        <div class="hidden md:flex items-center gap-6 text-sm text-white/80 font-medium">
          <a href="#features" class="hover:text-brand-yellow transition">Features</a>
          <a href="#how" class="hover:text-brand-yellow transition">How it works</a>
          <a href="#security" class="hover:text-brand-yellow transition">Security</a>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/login" class="px-5 py-2 text-white font-medium text-sm hover:text-brand-yellow transition">
            Sign in
          </a>
          <a routerLink="/signup" class="px-5 py-2.5 bg-brand-orange text-white font-semibold text-sm rounded-xl hover:bg-brand-orange-dark transition">
            Get Started
          </a>
        </div>
      </header>

      <!-- Hero -->
      <section class="container mx-auto px-6 py-16 lg:py-24 relative z-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 border border-brand-orange/30 rounded-full text-brand-yellow text-sm font-medium mb-6">
            <span class="w-2 h-2 bg-brand-yellow rounded-full animate-pulse"></span>
            Wallet + Rewards + KYC in one platform
          </div>
          <h1 class="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Your Wallet.<br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              Your Rewards.
            </span><br/>
            All in One Place.
          </h1>
          <p class="text-lg lg:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Pay smarter, collect loyalty points, and manage verification securely. Built for users, teams, and admins who need speed and trust.
          </p>
          <div class="flex items-center justify-center gap-4 flex-wrap">
            <a routerLink="/signup" class="px-8 py-4 bg-brand-orange text-white font-bold text-base rounded-xl hover:bg-brand-orange-dark hover:scale-105 transition-all shadow-lg shadow-brand-orange/30">
              Create Free Account
            </a>
            <a routerLink="/login" class="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold text-base rounded-xl border border-white/20 hover:bg-white/20 transition">
              Sign In
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <p class="text-brand-yellow text-xs uppercase tracking-wide font-semibold">Realtime Wallet</p>
              <p class="text-white font-bold text-xl mt-1">Instant Transfers</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <p class="text-brand-yellow text-xs uppercase tracking-wide font-semibold">Smart Loyalty</p>
              <p class="text-white font-bold text-xl mt-1">Points + Tiers</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <p class="text-brand-yellow text-xs uppercase tracking-wide font-semibold">Admin Control</p>
              <p class="text-white font-bold text-xl mt-1">KYC Review Workflow</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="container mx-auto px-6 py-12 relative z-10">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
            <div class="w-12 h-12 bg-brand-yellow rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Digital Wallet</h3>
            <p class="text-gray-300 text-sm">Top up, transfer, and track every transaction with real-time balance updates.</p>
          </div>

          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
            <div class="w-12 h-12 bg-brand-orange rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Loyalty Rewards</h3>
            <p class="text-gray-300 text-sm">Earn points on every transaction and redeem them for exclusive rewards.</p>
          </div>

          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
            <div class="w-12 h-12 bg-brand-red rounded-xl flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Bank-Grade Security</h3>
            <p class="text-gray-300 text-sm">Your data is protected with industry-standard encryption and KYC verification.</p>
          </div>
        </div>
      </section>

      <!-- How it works -->
      <section id="how" class="container mx-auto px-6 py-10 relative z-10">
        <div class="max-w-5xl mx-auto">
          <h2 class="text-3xl font-bold text-white text-center mb-8">How LoyalPay Works</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <article class="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p class="text-brand-yellow text-sm font-semibold">Step 1</p>
              <h3 class="text-white font-bold text-lg mt-1">Create Account</h3>
              <p class="text-gray-300 text-sm mt-2">Sign up with your details and start with a secure wallet profile.</p>
            </article>
            <article class="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p class="text-brand-yellow text-sm font-semibold">Step 2</p>
              <h3 class="text-white font-bold text-lg mt-1">Use Wallet</h3>
              <p class="text-gray-300 text-sm mt-2">Top up, transfer funds, and keep transparent transaction history.</p>
            </article>
            <article class="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p class="text-brand-yellow text-sm font-semibold">Step 3</p>
              <h3 class="text-white font-bold text-lg mt-1">Earn Rewards</h3>
              <p class="text-gray-300 text-sm mt-2">Collect points with activity and redeem curated rewards from catalog.</p>
            </article>
          </div>
        </div>
      </section>

      <!-- Security -->
      <section id="security" class="container mx-auto px-6 py-10 relative z-10">
        <div class="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10">
          <h2 class="text-2xl md:text-3xl font-bold text-white">Security first, always</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
            <div class="bg-black/20 rounded-xl p-4 border border-white/10">
              <p class="text-brand-yellow font-semibold">KYC Review</p>
              <p class="text-gray-300 mt-1">Built-in verification workflows for trusted accounts.</p>
            </div>
            <div class="bg-black/20 rounded-xl p-4 border border-white/10">
              <p class="text-brand-yellow font-semibold">JWT Sessions</p>
              <p class="text-gray-300 mt-1">Token-based authentication and secured API access.</p>
            </div>
            <div class="bg-black/20 rounded-xl p-4 border border-white/10">
              <p class="text-brand-yellow font-semibold">Auditability</p>
              <p class="text-gray-300 mt-1">Track key actions with transparent admin operations.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="container mx-auto px-6 py-16 relative z-10">
        <div class="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-800 rounded-3xl p-12 text-center shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)]">
          <h2 class="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p class="text-white/90 mb-8">Join thousands of users managing their finances smarter.</p>
          <a routerLink="/signup" class="inline-block px-8 py-4 bg-white text-brand-orange font-bold text-base rounded-xl hover:scale-105 transition-all shadow-lg">
            Create Your Account
          </a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="container mx-auto px-6 py-8 border-t border-white/10 relative z-10">
        <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-gray-400">
          <p>&copy; 2026 LoyalPay. All rights reserved.</p>
          <div class="flex gap-6">
            <a href="#" class="hover:text-brand-yellow transition">Privacy</a>
            <a href="#" class="hover:text-brand-yellow transition">Terms</a>
            <a href="#" class="hover:text-brand-yellow transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  `
})
export class HomeComponent {}
