"use client";
import React from "react";
import { FiUsers, FiCalendar, FiActivity, FiUserPlus, FiClock } from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-[85vh] bg-slate-50/50 p-6 md:p-8 font-sans rounded-3xl animate-fade-in-up">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-amber-400 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Welcome to The Grand Palace Hotel Management System.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-amber-200">
            <FiUserPlus className="text-lg" />
            Check-In Guest
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Stat Card 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Active Guests</p>
              <h3 className="text-3xl font-bold text-slate-800">428</h3>
            </div>
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-amber-100/50">
              <FiUsers />
            </div>
          </div>
          <div className="mt-5 flex items-center text-sm">
            <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">+12%</span>
            <span className="text-slate-400 ml-2">from last week</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">New Bookings</p>
              <h3 className="text-3xl font-bold text-slate-800">56</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-blue-100/50">
              <FiCalendar />
            </div>
          </div>
          <div className="mt-5 flex items-center text-sm">
            <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">+8%</span>
            <span className="text-slate-400 ml-2">today</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Available Rooms</p>
              <h3 className="text-3xl font-bold text-slate-800">42</h3>
            </div>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-emerald-100/50">
              <FiActivity />
            </div>
          </div>
          <div className="mt-5 flex items-center text-sm">
            <span className="text-slate-500 font-medium">Out of 250 total capacity</span>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Room Service Avg</p>
              <h3 className="text-3xl font-bold text-slate-800">18m</h3>
            </div>
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-rose-100/50">
              <FiClock />
            </div>
          </div>
          <div className="mt-5 flex items-center text-sm">
            <span className="text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-md text-xs">-2m</span>
            <span className="text-slate-400 ml-2">improved today</span>
          </div>
        </div>

      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FiCalendar className="text-amber-500" /> Recent Arrivals & Departures
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-sm font-semibold text-slate-400">
                  <th className="pb-3 text-slate-500 font-medium">Guest Name</th>
                  <th className="pb-3 text-slate-500 font-medium">Room Type</th>
                  <th className="pb-3 text-slate-500 font-medium">Time / Night</th>
                  <th className="pb-3 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-medium text-slate-700">Eleanor Vance</td>
                  <td className="py-4 text-slate-500">Suite - Ocean View</td>
                  <td className="py-4 text-slate-500">10:30 AM</td>
                  <td className="py-4">
                    <span className="bg-emerald-50 text-emerald-600 py-1 px-3 rounded-full text-xs font-semibold">Checked In</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-medium text-slate-700">Arthur Pendelton</td>
                  <td className="py-4 text-slate-500">Standard Double</td>
                  <td className="py-4 text-slate-500">11:00 AM</td>
                  <td className="py-4">
                    <span className="bg-slate-100 text-slate-600 py-1 px-3 rounded-full text-xs font-semibold">Checked Out</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 font-medium text-slate-700">Sophia Chen</td>
                  <td className="py-4 text-slate-500">Executive Penthouse</td>
                  <td className="py-4 text-slate-500">Arriving 02:00 PM</td>
                  <td className="py-4">
                    <span className="bg-amber-50 text-amber-600 py-1 px-3 rounded-full text-xs font-semibold">Pending Arrival</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Panel */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/40 relative overflow-hidden border border-amber-900/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mx-20 -my-20"></div>
          <h2 className="text-xl font-bold mb-6 relative z-10 flex items-center gap-2 text-amber-500">
            <FiActivity className="text-amber-500" /> Concierge Alerts
          </h2>
          <div className="space-y-6 relative z-10">
             <div className="flex flex-col gap-1">
               <p className="text-amber-500 text-xs font-semibold tracking-wider uppercase">VIP Arrival</p>
               <p className="text-sm font-medium leading-relaxed text-slate-300">Mr. Sterling arriving in 30 mins to Penthouse A.</p>
             </div>
             <div className="h-px bg-white/10 w-full" />
             <div className="flex flex-col gap-1">
               <p className="text-amber-500 text-xs font-semibold tracking-wider uppercase">Room Service</p>
               <p className="text-sm font-medium leading-relaxed text-slate-300">Room 402 requested extra towels and turn-down service.</p>
             </div>
             <button className="mt-8 text-sm font-bold border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-slate-900 w-full rounded-xl py-3 transition-colors duration-300">
               View All Alerts
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}
