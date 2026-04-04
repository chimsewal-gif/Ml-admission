'use client';

import { useState } from 'react';

export default function SecurityPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Password changed (not implemented)");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Password & Security</h2>
      <div className="bg-white p-4 shadow rounded space-y-4">
        <div>
          <label>New Password:</label>
          <input 
            type="password"
            className="w-full border rounded px-4 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Confirm Password:</label>
          <input 
            type="password"
            className="w-full border rounded px-4 py-2"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button 
          onClick={handlePasswordChange}
          className="bg-green-700 text-white px-6 py-2 rounded font-semibold"
        >
          Change Password
        </button>
      </div>
    </div>
  );
}
