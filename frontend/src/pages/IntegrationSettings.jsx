import { useState, useEffect } from 'react';
import { 
  getIntegrationStatus, 
  getUserTeams, 
  getTeamChannels, 
  configureTeamsChannel,
  updateIntegrationSettings,
  disconnectIntegration,
  getMicrosoftAuthUrl
} from '../services/api';
import { Mail, Users, CheckCircle2, XCircle, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const IntegrationSettings = () => {
  const [status, setStatus] = useState(null);
  const [teams, setTeams] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [settings, setSettings] = useState({
    sendEmailNotifications: true,
    sendTeamsNotifications: true,
    notifyOnIssueCreate: true,
    notifyOnIssueUpdate: true,
    notifyOnComment: true,
    notifyOnStatusChange: true,
    notifyOnAssignment: true,
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await getIntegrationStatus();
      setStatus(response.data);
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
      // Load teams if Teams is connected (even if no teamId is set yet)
      if (response.data.teams.isConnected) {
        loadTeams();
        // Only load channels if a teamId is already configured
        if (response.data.teams.teamId) {
          loadChannels(response.data.teams.teamId);
          setSelectedTeam(response.data.teams.teamId);
          setSelectedChannel(response.data.teams.channelId);
        }
      }
    } catch (error) {
      toast.error('Failed to load integration status');
    }
  };

  const loadTeams = async () => {
    try {
      const response = await getUserTeams();
      setTeams(response.data.teams || []);
    } catch (error) {
      console.error('Failed to load Teams:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load Teams. Please check your connection.';
      toast.error(errorMessage);
    }
  };

  const loadChannels = async (teamId) => {
    if (!teamId) {
      setChannels([]);
      return;
    }
    setLoadingChannels(true);
    try {
      const response = await getTeamChannels(teamId);
      setChannels(response.data.channels || []);
      if (response.data.channels && response.data.channels.length === 0) {
        toast.info('No channels found for this team');
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load channels. Please check your connection.';
      toast.error(errorMessage);
      setChannels([]);
    } finally {
      setLoadingChannels(false);
    }
  };

  const connectOutlook = async () => {
    try {
      const response = await getMicrosoftAuthUrl('outlook');
      window.location.href = response.data.authUrl;
    } catch (error) {
      toast.error('Failed to get authentication URL');
    }
  };

  const connectTeams = async () => {
    try {
      const response = await getMicrosoftAuthUrl('teams');
      window.location.href = response.data.authUrl;
    } catch (error) {
      toast.error('Failed to get authentication URL');
    }
  };

  const handleTeamChange = (teamId) => {
    setSelectedTeam(teamId);
    setSelectedChannel('');
    if (teamId) {
      loadChannels(teamId);
    }
  };

  const saveTeamsConfig = async () => {
    if (!selectedTeam || !selectedChannel) {
      toast.error('Please select both team and channel');
      return;
    }

    setLoading(true);
    try {
      await configureTeamsChannel({ teamId: selectedTeam, channelId: selectedChannel });
      toast.success('Teams channel configured successfully');
      loadStatus();
    } catch (error) {
      toast.error('Failed to configure channel');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (type) => {
    if (!confirm(`Are you sure you want to disconnect ${type}?`)) return;

    try {
      await disconnectIntegration(type);
      toast.success(`${type} disconnected successfully`);
      loadStatus();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const handleSettingsChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await updateIntegrationSettings({ [key]: value });
      toast.success('Settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
      // Revert on error
      setSettings(settings);
    }
  };

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const details = urlParams.get('details');
    
    if (success === 'connected') {
      toast.success('Microsoft integration connected successfully!');
      loadStatus();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      // Provide user-friendly error messages
      let errorMessage = 'Connection failed';
      
      switch (error) {
        case 'invalid_client_credentials':
          errorMessage = 'Invalid client credentials. Please check your Azure app configuration.';
          break;
        case 'invalid_or_expired_code':
          errorMessage = 'Authorization code expired. Please try connecting again.';
          break;
        case 'redirect_uri_mismatch':
          errorMessage = `Redirect URI mismatch. Ensure "${details || 'http://localhost:5000/api/microsoft/callback'}" is added in Azure Portal.`;
          break;
        case 'missing_config':
          errorMessage = 'Microsoft integration not configured. Please check your environment variables.';
          break;
        case 'user_info_failed':
          errorMessage = 'Failed to retrieve user information. Please try again.';
          break;
        case 'missing_params':
          errorMessage = 'Missing required parameters. Please try connecting again.';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid state parameter. Please try connecting again.';
          break;
        default:
          errorMessage = `Connection failed: ${decodeURIComponent(error)}`;
      }
      
      toast.error(errorMessage, { duration: 6000 });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Microsoft Integrations</h1>

      {/* Outlook Integration */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold">Microsoft Outlook</h2>
          </div>
          {status?.outlook?.isConnected ? (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Not Connected</span>
            </div>
          )}
        </div>

        {status?.outlook?.isConnected ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Connected as: <strong>{status.outlook.email}</strong>
            </p>
            <button
              onClick={() => handleDisconnect('outlook')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect Outlook
            </button>
          </div>
        ) : (
          <button
            onClick={connectOutlook}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Connect Outlook
          </button>
        )}
      </div>

      {/* Teams Integration */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Microsoft Teams</h2>
          </div>
          {status?.teams?.isConnected ? (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Not Connected</span>
            </div>
          )}
        </div>

        {status?.teams?.isConnected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Team</label>
              <select
                value={selectedTeam || status.teams.teamId}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Channel</label>
                {loadingChannels ? (
                  <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 flex items-center">
                    <span className="text-sm text-gray-500">Loading channels...</span>
                  </div>
                ) : (
                  <select
                    value={selectedChannel || status.teams.channelId || ''}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={loadingChannels}
                  >
                    <option value="">Select a channel</option>
                    {channels.length === 0 ? (
                      <option value="" disabled>No channels available</option>
                    ) : (
                      channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.displayName}
                        </option>
                      ))
                    )}
                  </select>
                )}
                {!loadingChannels && channels.length === 0 && selectedTeam && (
                  <p className="text-xs text-gray-500 mt-1">No channels found for this team. Make sure you have access to the team's channels.</p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={saveTeamsConfig}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                onClick={() => handleDisconnect('teams')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Disconnect Teams
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={connectTeams}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Connect Teams
          </button>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Notification Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Send Email Notifications</label>
              <p className="text-xs text-gray-500">Enable email notifications via Outlook</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sendEmailNotifications}
              onChange={(e) => handleSettingsChange('sendEmailNotifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Send Teams Notifications</label>
              <p className="text-xs text-gray-500">Enable Teams channel notifications</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sendTeamsNotifications}
              onChange={(e) => handleSettingsChange('sendTeamsNotifications', e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">Email Notification Preferences</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm">Notify on Issue Creation</label>
                <input
                  type="checkbox"
                  checked={settings.notifyOnIssueCreate}
                  onChange={(e) => handleSettingsChange('notifyOnIssueCreate', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Notify on Issue Update</label>
                <input
                  type="checkbox"
                  checked={settings.notifyOnIssueUpdate}
                  onChange={(e) => handleSettingsChange('notifyOnIssueUpdate', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Notify on Comments</label>
                <input
                  type="checkbox"
                  checked={settings.notifyOnComment}
                  onChange={(e) => handleSettingsChange('notifyOnComment', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Notify on Status Change</label>
                <input
                  type="checkbox"
                  checked={settings.notifyOnStatusChange}
                  onChange={(e) => handleSettingsChange('notifyOnStatusChange', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Notify on Assignment</label>
                <input
                  type="checkbox"
                  checked={settings.notifyOnAssignment}
                  onChange={(e) => handleSettingsChange('notifyOnAssignment', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationSettings;

