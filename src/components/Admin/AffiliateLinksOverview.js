import React, { useState, useEffect } from 'react';
import { FaLink, FaUsers, FaChartLine, FaEye, FaCheckCircle, FaTimes, FaUserTie, FaCalendar, FaExternalLinkAlt, FaCopy } from 'react-icons/fa';
import { adminAuth } from '../../services/adminApi';

const AffiliateLinksOverview = () => {
  const [affiliateData, setAffiliateData] = useState(null);
  const [referralsData, setReferralsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('links');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [linksResponse, referralsResponse] = await Promise.all([
        adminAuth.getAffiliateLinks(),
        adminAuth.getAffiliateReferrals()
      ]);

      setAffiliateData(linksResponse);
      setReferralsData(referralsResponse);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading affiliate data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview - Dark Theme */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
          <FaLink className="mr-2" />
          Affiliate System Overview
        </h2>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <FaLink className="text-blue-500" />
            <span className="text-gray-400">Total Links:</span>
            <span className="text-white font-semibold">{affiliateData?.totalLinks || affiliateData?.links?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-500" />
            <span className="text-gray-400">Active:</span>
            <span className="text-white font-semibold">{affiliateData?.activeLinks || affiliateData?.links?.filter(l => l.isActive).length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEye className="text-purple-500" />
            <span className="text-gray-400">Total Clicks:</span>
            <span className="text-white font-semibold">{affiliateData?.totalClicks || affiliateData?.links?.reduce((sum, l) => sum + (l.clickCount || 0), 0) || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUsers className="text-orange-500" />
            <span className="text-gray-400">Referrals:</span>
            <span className="text-white font-semibold">{referralsData?.totalReferrals || referralsData?.referrals?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaChartLine className="text-yellow-500" />
            <span className="text-gray-400">Active Users:</span>
            <span className="text-white font-semibold">{referralsData?.activeReferrals || referralsData?.referrals?.filter(r => r.isActive).length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaChartLine className="text-pink-500" />
            <span className="text-gray-400">Conversion:</span>
            <span className="text-white font-semibold">
              {affiliateData?.totalClicks > 0 
                ? (((referralsData?.totalReferrals || 0) / (affiliateData?.totalClicks || 1)) * 100).toFixed(1) + '%'
                : '0.0%'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Updated Style */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('links')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'links'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <FaLink className="inline mr-2" />
              Affiliate Links ({affiliateData?.links?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'referrals'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <FaUsers className="inline mr-2" />
              Referrals ({referralsData?.referrals?.length || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'links' && (
          <div className="p-4 bg-blue-500/10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                <FaLink className="mr-2" />
                Affiliate Links Management
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">
                  {affiliateData?.links?.length || 0} total links
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'links' && affiliateData?.links?.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <FaLink className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-gray-400">No affiliate links created yet</p>
            <p className="text-sm mt-2 text-gray-500">Links will appear here when agents create affiliate links</p>
          </div>
        )}

        {activeTab === 'links' && affiliateData?.links?.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden p-4 space-y-4">
              {affiliateData?.links?.map((link) => (
                <div key={link._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  {/* Header with agent info */}
                  <div className="flex items-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {(link.agent?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base truncate">{link.agent?.name || 'Unknown Agent'}</h3>
                      <p className="text-gray-400 text-sm">ID: {link.agent?.agentId || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      link.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {link.isActive ? (
                        <>
                          <FaCheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <FaTimes className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Affiliate Code */}
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">Affiliate Code:</div>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded mr-2 flex-1 truncate">
                        {link.affiliateCode}
                      </div>
                      <button
                        onClick={() => copyToClipboard(link.affiliateCode)}
                        className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                        title="Copy code"
                      >
                        <FaCopy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-800/50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaEye className="text-purple-400 mr-1 h-4 w-4" />
                      </div>
                      <div className="text-lg font-bold text-white">{link.clickCount}</div>
                      <div className="text-xs text-gray-400">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaUsers className="text-orange-400 mr-1 h-4 w-4" />
                      </div>
                      <div className="text-lg font-bold text-white">{link.registrationCount}</div>
                      <div className="text-xs text-gray-400">Referrals</div>
                    </div>
                  </div>
                  
                  {/* Conversion and Date */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaChartLine className="text-yellow-400 mr-2 h-4 w-4" />
                        <span className="text-gray-400 text-sm">Conversion:</span>
                      </div>
                      <span className={`font-semibold ${
                        link.clickCount > 0 && link.registrationCount > 0 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                      }`}>
                        {link.clickCount > 0 ? ((link.registrationCount / link.clickCount) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2 h-4 w-4" />
                        <span className="text-gray-400 text-sm">Created:</span>
                      </div>
                      <span className="text-gray-300 text-sm">{formatDate(link.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => copyToClipboard(`${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:8000'}/register?ref=${link.affiliateCode}`)}
                    className="w-full text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FaExternalLinkAlt className="h-4 w-4" />
                    Copy Full Link
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                  <tr>
                    <th className="px-6 py-3">Agent</th>
                    <th className="px-6 py-3">Affiliate Code</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Performance</th>
                    <th className="px-6 py-3">Conversion</th>
                    <th className="px-6 py-3">Created</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {affiliateData?.links?.map((link) => (
                    <tr key={link._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                            {(link.agent?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{link.agent?.name || 'Unknown Agent'}</div>
                            <div className="text-sm text-gray-400">ID: {link.agent?.agentId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded mr-2">
                            {link.affiliateCode}
                          </div>
                          <button
                            onClick={() => copyToClipboard(link.affiliateCode)}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                            title="Copy code"
                          >
                            <FaCopy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          link.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {link.isActive ? (
                            <>
                              <FaCheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaTimes className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <FaEye className="text-purple-400 mr-2 h-3 w-3" />
                            <span className="text-gray-400">Clicks:</span>
                            <span className="text-white font-semibold ml-1">{link.clickCount}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <FaUsers className="text-orange-400 mr-2 h-3 w-3" />
                            <span className="text-gray-400">Referrals:</span>
                            <span className="text-white font-semibold ml-1">{link.registrationCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaChartLine className="text-yellow-400 mr-2 h-4 w-4" />
                          <span className={`font-semibold ${
                            link.clickCount > 0 && link.registrationCount > 0 
                              ? 'text-green-400' 
                              : 'text-gray-400'
                          }`}>
                            {link.clickCount > 0 ? ((link.registrationCount / link.clickCount) * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                          <span className="text-gray-300">{formatDate(link.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => copyToClipboard(`${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:8000'}/register?ref=${link.affiliateCode}`)}
                          className="text-blue-400 hover:text-blue-300 transition-colors flex items-center text-sm"
                          title="Copy link"
                        >
                          <FaExternalLinkAlt className="mr-1 h-3 w-3" />
                          Copy Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'referrals' && (
          <div className="p-4 bg-orange-500/10">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-300 flex items-center">
                <FaUsers className="mr-2" />
                Affiliate Referrals
              </h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center gap-2">
                  <FaUsers className="text-orange-400" />
                  <span className="text-gray-400">Active:</span>
                  <span className="text-white font-semibold">{referralsData?.activeReferrals || referralsData?.referrals?.filter(r => r.isActive).length || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaChartLine className="text-yellow-400" />
                  <span className="text-gray-400">Total Coins:</span>
                  <span className="text-white font-semibold">{referralsData?.totalCoinsUsed || referralsData?.referrals?.reduce((sum, r) => sum + (r.totalCoinsUsed || 0), 0) || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && referralsData?.referrals?.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <FaUsers className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-gray-400">No referrals yet</p>
            <p className="text-sm mt-2 text-gray-500">Referrals will appear here when users register through affiliate links</p>
          </div>
        )}

        {activeTab === 'referrals' && referralsData?.referrals?.length > 0 && (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden p-4 space-y-4">
              {referralsData?.referrals?.map((referral) => (
                <div key={referral._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                  {/* Header with user info */}
                  <div className="flex items-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {referral.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base truncate">{referral.username}</h3>
                      <p className="text-gray-400 text-sm truncate">{referral.email}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="mb-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      referral.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {referral.isActive ? (
                        <>
                          <FaCheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <FaTimes className="mr-1 h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Referral Details */}
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg space-y-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Referred By:</div>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs mr-2">
                          <FaUserTie />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {referral.referredBy?.name || 'Unknown Agent'}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {referral.referredBy?.agentId || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Affiliate Code:</div>
                      <div className="flex items-center">
                        <div className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded mr-2 flex-1 truncate">
                          {referral.affiliateCode}
                        </div>
                        <button
                          onClick={() => copyToClipboard(referral.affiliateCode)}
                          className="text-gray-400 hover:text-blue-400 transition-colors p-1"
                          title="Copy code"
                        >
                          <FaCopy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Stats */}
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaChartLine className="text-yellow-400 mr-2 h-4 w-4" />
                        <span className="text-gray-400 text-sm">Coins Used:</span>
                      </div>
                      <span className="text-white font-semibold">{referral.totalCoinsUsed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2 h-4 w-4" />
                        <span className="text-gray-400 text-sm">Last Active:</span>
                      </div>
                      <span className="text-gray-300 text-sm">
                        {referral.lastActive ? formatDate(referral.lastActive) : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2 h-4 w-4" />
                        <span className="text-gray-400 text-sm">Joined:</span>
                      </div>
                      <span className="text-gray-300 text-sm">{formatDate(referral.joinedDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Referred By</th>
                    <th className="px-6 py-3">Affiliate Code</th>
                    <th className="px-6 py-3">Activity</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Join Date</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {referralsData?.referrals?.map((referral) => (
                    <tr key={referral._id} className="border-t border-gray-700 hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                            {referral.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{referral.username}</div>
                            <div className="text-sm text-gray-400">{referral.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold mr-2">
                            <FaUserTie />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {referral.referredBy?.name || 'Unknown Agent'}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {referral.referredBy?.agentId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded mr-2">
                            {referral.affiliateCode}
                          </div>
                          <button
                            onClick={() => copyToClipboard(referral.affiliateCode)}
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                            title="Copy code"
                          >
                            <FaCopy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <FaChartLine className="text-yellow-400 mr-2 h-3 w-3" />
                            <span className="text-gray-400">Coins:</span>
                            <span className="text-white font-semibold ml-1">{referral.totalCoinsUsed || 0}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                            <span className="text-gray-400">Last Active:</span>
                            <span className="text-gray-300 ml-1 text-xs">
                              {referral.lastActive ? formatDate(referral.lastActive) : 'Never'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          referral.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {referral.isActive ? (
                            <>
                              <FaCheckCircle className="mr-1 h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaTimes className="mr-1 h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                          <span className="text-gray-300">{formatDate(referral.joinedDate)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AffiliateLinksOverview;
