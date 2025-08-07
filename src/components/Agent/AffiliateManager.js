import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaLink, FaShare, FaUsers, FaChartLine, FaCopy, FaCheckCircle, FaTrash, FaSync, FaExclamationTriangle, FaEye, FaTrendingUp, FaCalendar, FaCoins } from 'react-icons/fa';
import agentApi, { agentAffiliate } from '../../services/agentApi';

const AffiliateManager = () => {
  const [affiliateData, setAffiliateData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [referralsSummary, setReferralsSummary] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const loadAffiliateData = async () => {
    try {
      setLoading(true);
      const [linkData, referralsData, statsData] = await Promise.all([
        agentAffiliate.getMyAffiliateLink(),
        agentAffiliate.getAffiliateReferrals(),
        agentAffiliate.getAffiliateStats()
      ]);

      setAffiliateData(linkData);
      setReferrals(referralsData.referrals || []);
      setReferralsSummary({
        totalAffiliateLinks: referralsData.totalAffiliateLinks || 0,
        activeLinks: referralsData.activeLinks || 0,
        revokedLinks: referralsData.revokedLinks || 0
      });
      setStats(statsData);
    } catch (error) {
      console.error('Error loading affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAffiliateLink = async () => {
    try {
      setActionLoading(true);
      const response = await agentAffiliate.createAffiliateLink();
      setAffiliateData(response);
      await loadAffiliateData(); // Reload all data
    } catch (error) {
      console.error('Error creating affiliate link:', error);
      alert('Failed to create affiliate link. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const revokeAffiliateLink = async () => {
    try {
      setActionLoading(true);
      await agentAffiliate.revokeAffiliateLink();
      setShowRevokeModal(false);
      await loadAffiliateData(); // Reload all data
      alert('Affiliate link has been revoked successfully');
    } catch (error) {
      console.error('Error revoking affiliate link:', error);
      alert('Failed to revoke affiliate link. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateAffiliateLink = async () => {
    try {
      setActionLoading(true);
      const response = await agentAffiliate.regenerateAffiliateLink();
      setAffiliateData(response);
      setShowRegenerateModal(false);
      await loadAffiliateData(); // Reload all data
      alert('New affiliate link has been generated successfully');
    } catch (error) {
      console.error('Error regenerating affiliate link:', error);
      alert('Failed to regenerate affiliate link. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-300">Loading affiliate data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaShare className="w-6 h-6 text-blue-400" />
          Affiliate Management
        </h1>
      </div>

      {/* Affiliate Link Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          <FaLink className="w-5 h-5 text-blue-400" />
          Your Affiliate Link
        </h2>

        {!affiliateData?.hasLink ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <FaShare className="w-12 h-12 text-gray-400 mx-auto" />
            </div>
            <p className="text-gray-300 mb-4">
              Create your affiliate link to start earning from referrals
            </p>
            <button
              onClick={createAffiliateLink}
              disabled={actionLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Creating...' : 'Create Affiliate Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg">
              <input
                type="text"
                value={affiliateData.link}
                readOnly
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-300"
              />
              <button
                onClick={() => copyToClipboard(affiliateData.link)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {copied ? <FaCheckCircle className="w-4 h-4" /> : <FaCopy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="text-sm text-gray-300 space-y-2">
              <div className="flex items-center">
                <span className="text-gray-400 font-medium w-24">Code:</span>
                <span className="text-blue-400 font-mono bg-gray-700 px-2 py-1 rounded">{affiliateData.affiliateCode}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 font-medium w-24">Created:</span>
                <span className="text-gray-300">{new Date(affiliateData.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 font-medium w-24">Status:</span>
                <span className={`ml-1 px-2 py-1 rounded text-xs font-semibold ${
                  affiliateData.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {affiliateData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowRegenerateModal(true)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSync className="w-4 h-4" />
                Regenerate Link
              </button>
              
              <button
                onClick={() => setShowRevokeModal(true)}
                disabled={actionLoading || !affiliateData.isActive}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaTrash className="w-4 h-4" />
                Revoke Link
              </button>
            </div>

            {!affiliateData.isActive && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <FaExclamationTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">This affiliate link has been revoked and is no longer active.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <FaChartLine className="mr-2" />
            Affiliate Performance
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FaEye className="text-purple-500" />
              <span className="text-gray-400">Total Clicks:</span>
              <span className="text-white font-semibold">{stats.totalClicks}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers className="text-green-500" />
              <span className="text-gray-400">Total Referrals:</span>
              <span className="text-white font-semibold">{stats.totalReferrals}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUsers className="text-orange-500" />
              <span className="text-gray-400">Active Referrals:</span>
              <span className="text-white font-semibold">{stats.activeReferrals}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCoins className="text-yellow-500" />
              <span className="text-gray-400">Total Earnings:</span>
              <span className="text-white font-semibold">${stats.totalEarnings?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaChartLine className="text-blue-500" />
              <span className="text-gray-400">Conversion Rate:</span>
              <span className="text-white font-semibold">{stats.conversionRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Affiliate Links History Summary */}
      {referralsSummary && referralsSummary.totalAffiliateLinks > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FaLink className="mr-2 text-blue-400" />
            Affiliate Links History
          </h2>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FaLink className="text-blue-500" />
              <span className="text-gray-400">Total Links Created:</span>
              <span className="text-white font-semibold">{referralsSummary.totalAffiliateLinks}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              <span className="text-gray-400">Active Links:</span>
              <span className="text-white font-semibold">{referralsSummary.activeLinks}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaTrash className="text-red-500" />
              <span className="text-gray-400">Revoked Links:</span>
              <span className="text-white font-semibold">{referralsSummary.revokedLinks}</span>
            </div>
          </div>
        </div>
      )}

      {/* Referrals Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
            <FaUsers className="w-5 h-5 text-orange-400" />
            All Referrals History ({referrals.length})
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Shows all referrals from current and previous affiliate links
          </p>
        </div>

        {referrals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaUsers className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">No referrals yet. Share your affiliate link to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm uppercase bg-gray-900/40">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Affiliate Code</th>
                  <th className="px-6 py-3">Link Status</th>
                  <th className="px-6 py-3">Joined Date</th>
                  <th className="px-6 py-3">Coins Used</th>
                  <th className="px-6 py-3">User Status</th>
                  <th className="px-6 py-3">Last Active</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold mr-3">
                          {referral.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-white">{referral.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">{referral.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-300 font-mono bg-gray-700 px-2 py-1 rounded mr-2">
                          {referral.affiliateCode}
                        </span>
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        referral.linkStatus === 'Active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : referral.linkStatus === 'Revoked'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {referral.linkStatus === 'Active' ? (
                          <>
                            <FaCheckCircle className="mr-1 h-3 w-3" />
                            Active Link
                          </>
                        ) : referral.linkStatus === 'Revoked' ? (
                          <>
                            <FaTrash className="mr-1 h-3 w-3" />
                            Revoked Link
                          </>
                        ) : (
                          'Unknown'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <FaCalendar className="text-gray-400 mr-2 h-3 w-3" />
                        <span className="text-gray-300">{new Date(referral.joinedDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm">
                        <FaCoins className="text-yellow-400 mr-2 h-3 w-3" />
                        <span className="text-white font-semibold">{referral.totalCoinsUsed}</span>
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
                            Active User
                          </>
                        ) : (
                          'Inactive User'
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {referral.lastActive 
                          ? new Date(referral.lastActive).toLocaleDateString() 
                          : 'Never'
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Revoke Affiliate Link</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to revoke your affiliate link? This action will deactivate your current link and prevent it from generating new referrals. Existing referrals will not be affected.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRevokeModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={revokeAffiliateLink}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Revoking...' : 'Revoke Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Confirmation Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <FaSync className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Regenerate Affiliate Link</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to regenerate your affiliate link? This will create a new link and deactivate your current one. Your existing referrals and earnings will be preserved, but you'll need to share the new link for future referrals.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRegenerateModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={regenerateAffiliateLink}
                disabled={actionLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Generating...' : 'Generate New Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateManager;
