import React from 'react';

export default function AnnouncementPopup() {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
        <div className="text-lg font-bold text-gray-800 mb-2">Pengumuman</div>
        <div className="text-gray-800 text-base font-medium">
          Kami akan segera Rilis. Ditunggu ya :).<br />
          <span className="font-semibold text-green-700">Barakallahu fiikum.</span>
        </div>
      </div>
    </div>
  );
} 