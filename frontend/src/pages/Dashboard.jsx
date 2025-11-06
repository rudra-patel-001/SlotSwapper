import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events');
      setEvents(response.data);
      setError('');
    } catch (err) {
      console.error('Fetch events error:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    try {
      await api.post('/events', formData);
      setShowCreateModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    try {
      await api.put(`/events/${editingEvent.id}`, formData);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update event');
    }
  };

  const handleToggleStatus = async (event) => {
    const newStatus = event.status === 'BUSY' ? 'SWAPPABLE' : 'BUSY';

    try {
      await api.put(`/events/${event.id}`, { status: newStatus });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete event');
    }
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      start_time: event.start_time?.substring(0, 16),
      end_time: event.end_time?.substring(0, 16)
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      start_time: '',
      end_time: ''
    });
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
      BUSY: 'badge-busy',
      SWAPPABLE: 'badge-swappable',
      SWAP_PENDING: 'badge-pending'
    };
    return badges[status] || 'badge-busy';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-1">Manage your time slots</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <span className="text-xl">+</span>
          <span>Create Event</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-6">Create your first event to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="card-hover">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  {event.title}
                </h3>
                <span className={`${getStatusBadge(event.status)} ml-2`}>
                  {event.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <span className="font-medium mr-2">Start:</span>
                  {formatDateTime(event.start_time)}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-2">End:</span>
                  {formatDateTime(event.end_time)}
                </div>
              </div>

              {event.status !== 'SWAP_PENDING' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditModal(event)}
                    className="btn-outline text-sm flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(event)}
                    className={`text-sm flex-1 ${
                      event.status === 'SWAPPABLE' ? 'btn-secondary' : 'btn-success'
                    }`}
                  >
                    {event.status === 'SWAPPABLE' ? 'Mark Busy' : 'Make Swappable'}
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="btn-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}

              {event.status === 'SWAP_PENDING' && (
                <div className="alert-warning text-sm">
                  ⏳ Swap in progress
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="input-label">Event Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Team meeting, Workshop, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Time</label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">End Time</label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Create Event
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={!!editingEvent}
        onClose={() => {
          setEditingEvent(null);
          resetForm();
        }}
        title="Edit Event"
      >
        <form onSubmit={handleUpdateEvent} className="space-y-4">
          <div>
            <label className="input-label">Event Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Start Time</label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">End Time</label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Update Event
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                resetForm();
              }}
              className="btn-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;