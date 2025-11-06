import { useState, useEffect } from 'react';
import api from '../services/api';

const Requests = () => {
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/swap-requests/incoming'),
        api.get('/swap-requests/outgoing')
      ]);

      setIncomingRequests(incomingRes.data);
      setOutgoingRequests(outgoingRes.data);
      setError('');
    } catch (err) {
      console.error('Fetch requests error:', err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId, accept) => {
    try {
      await api.post(`/swap-requests/${requestId}/respond`, {
        accept: accept
      });

      alert(accept ? 'Swap accepted successfully!' : 'Swap rejected');
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to process response');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'badge-pending',
      ACCEPTED: 'badge-accepted',
      REJECTED: 'badge-rejected'
    };
    return badges[status] || 'badge-pending';
  };

  const RequestCard = ({ request, isIncoming }) => (
    <div className="card">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isIncoming ? 'From' : 'To'}: {isIncoming ? request.requester_name : request.responder_name}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatDateTime(request.created_at)}
          </p>
        </div>
        <span className={getStatusBadge(request.status)}>
          {request.status}
        </span>
      </div>

      <div className="space-y-4">
        {/* Their Slot */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">
            {isIncoming ? 'They want:' : 'You requested:'}
          </p>
          <p className="font-semibold text-gray-900">
            {isIncoming ? request.their_slot_title : request.their_slot_title}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {formatDateTime(isIncoming ? request.their_slot_start : request.their_slot_start)} - 
            {formatDateTime(isIncoming ? request.their_slot_end : request.their_slot_end)}
          </p>
        </div>

        {/* Your Slot */}
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-1">
            {isIncoming ? 'They offer:' : 'You offered:'}
          </p>
          <p className="font-semibold text-gray-900">
            {isIncoming ? request.my_slot_title : request.my_slot_title}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {formatDateTime(isIncoming ? request.my_slot_start : request.my_slot_start)} - 
            {formatDateTime(isIncoming ? request.my_slot_end : request.my_slot_end)}
          </p>
        </div>
      </div>

      {/* Action Buttons (only for incoming pending requests) */}
      {isIncoming && request.status === 'PENDING' && (
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => handleResponse(request.id, true)}
            className="btn-success flex-1"
          >
            ✓ Accept
          </button>
          <button
            onClick={() => handleResponse(request.id, false)}
            className="btn-danger flex-1"
          >
            ✕ Reject
          </button>
        </div>
      )}

      {/* Status Messages */}
      {request.status === 'ACCEPTED' && (
        <div className="alert-success mt-4">
          ✓ Swap completed successfully!
        </div>
      )}

      {request.status === 'REJECTED' && (
        <div className="alert-error mt-4">
          ✕ Swap was rejected
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Swap Requests</h1>
        <p className="text-gray-600 mt-1">Manage incoming and outgoing requests</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'incoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Incoming
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
              {incomingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'outgoing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Outgoing
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
              {outgoingRequests.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'incoming' ? (
        incomingRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No incoming requests</h3>
            <p className="text-gray-500">When someone requests your slots, they'll appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incomingRequests.map((request) => (
              <RequestCard key={request.id} request={request} isIncoming={true} />
            ))}
          </div>
        )
      ) : (
        outgoingRequests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📤</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No outgoing requests</h3>
            <p className="text-gray-500">Browse the marketplace to request swaps</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outgoingRequests.map((request) => (
              <RequestCard key={request.id} request={request} isIncoming={false} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Requests;