import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Marketplace = () => {
  const [slots, setSlots] = useState([]);
  const [mySwappableSlots, setMySwappableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMySlot, setSelectedMySlot] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [marketplaceRes, myEventsRes] = await Promise.all([
        api.get('/marketplace'),
        api.get('/events')
      ]);

      setSlots(marketplaceRes.data);
      
      // Filter only SWAPPABLE events
      const swappable = myEventsRes.data.filter(
        event => event.status === 'SWAPPABLE'
      );
      setMySwappableSlots(swappable);
      setError('');
    } catch (err) {
      console.error('Fetch marketplace error:', err);
      setError('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSwap = async () => {
    if (!selectedMySlot) {
      alert('Please select one of your slots');
      return;
    }

    setRequesting(true);

    try {
      await api.post('/swap-requests', {
        my_slot_id: parseInt(selectedMySlot),
        their_slot_id: selectedSlot.id
      });

      alert('Swap request sent successfully!');
      setSelectedSlot(null);
      setSelectedMySlot('');
      fetchData(); // Refresh to update statuses
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send swap request');
    } finally {
      setRequesting(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-gray-600 mt-1">Browse and request available time slots</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Slots Grid */}
      {slots.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No available slots</h3>
          <p className="text-gray-500">Check back later for new opportunities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => (
            <div key={slot.id} className="card-hover">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {slot.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Owner: <span className="font-medium">{slot.owner_name}</span>
                  </p>
                </div>
                <span className="badge-swappable">
                  SWAPPABLE
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Start:</span>
                  {formatDateTime(slot.start_time)}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">End:</span>
                  {formatDateTime(slot.end_time)}
                </div>
              </div>

              <button
                onClick={() => setSelectedSlot(slot)}
                className="btn-primary w-full"
              >
                Request Swap
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Swap Request Modal */}
      <Modal
        isOpen={!!selectedSlot}
        onClose={() => {
          setSelectedSlot(null);
          setSelectedMySlot('');
        }}
        title="Request Slot Swap"
      >
        {selectedSlot && (
          <div className="space-y-6">
            {/* Their Slot Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Requesting:</h3>
              <p className="text-gray-700 font-medium">{selectedSlot.title}</p>
              <p className="text-sm text-gray-600 mt-1">
                Owner: {selectedSlot.owner_name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatDateTime(selectedSlot.start_time)} - {formatDateTime(selectedSlot.end_time)}
              </p>
            </div>

            {/* Select Your Slot */}
            <div>
              <label className="input-label">Select your slot to offer:</label>
              
              {mySwappableSlots.length === 0 ? (
                <div className="alert-warning">
                  You don't have any swappable slots. Please mark at least one event as swappable first.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mySwappableSlots.map((slot) => (
                    <label
                      key={slot.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMySlot === slot.id.toString()
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mySlot"
                        value={slot.id}
                        checked={selectedMySlot === slot.id.toString()}
                        onChange={(e) => setSelectedMySlot(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-medium">{slot.title}</span>
                      <p className="text-sm text-gray-600 ml-6 mt-1">
                        {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}
                      </p>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleRequestSwap}
                disabled={requesting || mySwappableSlots.length === 0}
                className="btn-primary flex-1"
              >
                {requesting ? 'Sending...' : 'Send Request'}
              </button>
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setSelectedMySlot('');
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Marketplace;