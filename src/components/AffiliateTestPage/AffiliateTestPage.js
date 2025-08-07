import React, { useState } from 'react';
import { FaLink, FaShare, FaCopy, FaCheckCircle } from 'react-icons/fa';
import config from '../../config/environment';

const AffiliateTestPage = () => {
  const [testCode, setTestCode] = useState('agent1_1641909600000');
  const [copied, setCopied] = useState(false);

  // Get frontend URL from environment or default to localhost:8000
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:8000';
  const testLink = `${frontendUrl}/auth?ref=${testCode}&signup=true`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-2">
          <FaShare className="w-8 h-8" />
          Affiliate Link Test Page
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Affiliate Link</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Affiliate Code:
              </label>
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter affiliate code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Generated Test Link:
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-700 rounded border border-gray-600">
                <input
                  type="text"
                  value={testLink}
                  readOnly
                  className="flex-1 bg-transparent text-white outline-none text-sm"
                />
                <button
                  onClick={() => copyToClipboard(testLink)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  {copied ? <FaCheckCircle className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href={testLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaLink className="w-4 h-4" />
                Test Link (New Tab)
              </a>
              
              <a
                href={testLink}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <FaShare className="w-4 h-4" />
                Test Link (Same Tab)
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
          
          <div className="text-gray-300 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                1
              </div>
              <div>
                <h3 className="font-semibold text-white">Agent Creates Link</h3>
                <p className="text-sm">Agent goes to "Affiliate Links" tab and creates their unique affiliate link.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white">Share Link</h3>
                <p className="text-sm">Agent shares the link with potential users via social media, email, etc.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white">User Clicks Link</h3>
                <p className="text-sm">When user clicks the link, it automatically fills the referral code and switches to signup form.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                4
              </div>
              <div>
                <h3 className="font-semibold text-white">User Registers</h3>
                <p className="text-sm">User completes registration and is automatically assigned to the referring agent.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                5
              </div>
              <div>
                <h3 className="font-semibold text-white">Tracking & Analytics</h3>
                <p className="text-sm">Agent can view their referral stats, and admin can see all affiliate activity.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mt-6">
          <h3 className="text-yellow-400 font-semibold mb-2">Features Implemented:</h3>
          <ul className="text-yellow-300 text-sm space-y-1">
            <li>✅ Automatic referral code detection from URL</li>
            <li>✅ Auto-fill referral code in registration form</li>
            <li>✅ Manual referral code entry option</li>
            <li>✅ Click tracking for affiliate links</li>
            <li>✅ Registration tracking and user assignment</li>
            <li>✅ Agent affiliate link management interface</li>
            <li>✅ Admin overview of all affiliate activity</li>
            <li>✅ Real-time statistics and analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AffiliateTestPage;
