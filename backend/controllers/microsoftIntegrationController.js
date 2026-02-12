import axios from 'axios';
import MicrosoftIntegration from '../models/MicrosoftIntegration.js';
import { getUserTeams, getTeamChannels, getValidAccessToken } from '../services/microsoftGraphService.js';

/**
 * Get OAuth URL for Microsoft authentication
 */
export const getMicrosoftAuthUrl = async (req, res) => {
  try {
    const { integrationType } = req.query; // 'outlook', 'teams', or 'both'
    
    const scopes = {
      outlook: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite offline_access',
      teams: 'https://graph.microsoft.com/ChannelMessage.Send https://graph.microsoft.com/Team.ReadBasic.All https://graph.microsoft.com/Channel.ReadBasic.All offline_access',
      both: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/ChannelMessage.Send https://graph.microsoft.com/Team.ReadBasic.All https://graph.microsoft.com/Channel.ReadBasic.All offline_access',
    };

    const scope = scopes[integrationType] || scopes.both;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/microsoft/callback`;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID;

    if (!clientId || !tenantId) {
      console.error('Microsoft integration not configured - missing CLIENT_ID or TENANT_ID');
      return res.status(500).json({ message: 'Microsoft integration not configured' });
    }

    console.log('Generating OAuth URL:', {
      integrationType,
      redirectUri,
      clientId: clientId.substring(0, 8) + '...', // Log partial ID for security
      tenantId,
    });

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_mode=query&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${req.user._id}_${integrationType}`;

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Handle OAuth callback
 */
export const handleMicrosoftCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors from Microsoft
    if (error) {
      console.error('Microsoft OAuth error:', error, error_description);
      const errorMsg = error_description || error;
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=${encodeURIComponent(errorMsg)}`
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in callback');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=missing_params`);
    }

    const [userId, integrationType] = state.split('_');

    if (!userId || !integrationType) {
      console.error('Invalid state parameter:', state);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=invalid_state`);
    }

    // Validate environment variables
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET || !process.env.MICROSOFT_TENANT_ID) {
      console.error('Missing Microsoft configuration in environment variables');
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=missing_config`
      );
    }

    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/microsoft/callback`;
    console.log('Exchanging code for token with redirect_uri:', redirectUri);

    // Exchange code for tokens
    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } catch (tokenError) {
      const errorDetails = tokenError.response?.data || tokenError.message;
      
      // Log error details only in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('Token exchange error:', JSON.stringify(errorDetails, null, 2));
        console.error('Request details:', {
          tenantId: process.env.MICROSOFT_TENANT_ID,
          clientId: process.env.MICROSOFT_CLIENT_ID,
          clientSecretLength: process.env.MICROSOFT_CLIENT_SECRET?.length || 0,
          redirectUri,
          hasCode: !!code,
          codeLength: code?.length || 0,
        });
      } else {
        // In production, log minimal error info
        console.error('Token exchange error:', tokenError.response?.data?.error || 'Unknown error');
      }
      
      // Provide specific error messages
      if (tokenError.response?.data?.error === 'invalid_client') {
        // Log error without exposing sensitive configuration details
        if (process.env.NODE_ENV !== 'production') {
          console.error('Invalid client error - Microsoft OAuth configuration issue detected');
        }
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=invalid_client_credentials`
        );
      }
      if (tokenError.response?.data?.error === 'invalid_grant') {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=invalid_or_expired_code`
        );
      }
      if (tokenError.response?.data?.error === 'redirect_uri_mismatch') {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=redirect_uri_mismatch&details=${encodeURIComponent(redirectUri)}`
        );
      }
      
      const errorDescription = tokenError.response?.data?.error_description || tokenError.response?.data?.error || 'token_exchange_failed';
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=${encodeURIComponent(errorDescription)}`
      );
    }

    if (!tokenResponse.data.access_token) {
      console.error('No access token in response:', tokenResponse.data);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=no_access_token`
      );
    }

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Get user info
    let userResponse;
    try {
      userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
    } catch (userError) {
      console.error('Get user info error:', userError.response?.data || userError.message);
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=user_info_failed`
      );
    }

    const email = userResponse.data.mail || userResponse.data.userPrincipalName;

    // Save integration
    let integration = await MicrosoftIntegration.findOne({ userId });

    if (!integration) {
      integration = await MicrosoftIntegration.create({
        userId,
        integrationType,
      });
    }

    if (integrationType === 'outlook' || integrationType === 'both') {
      integration.outlook = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        email,
        isConnected: true,
      };
    }

    if (integrationType === 'teams' || integrationType === 'both') {
      integration.teams = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        tenantId: process.env.MICROSOFT_TENANT_ID,
        isConnected: true,
      };
    }

    if (integrationType === 'both') {
      integration.integrationType = 'both';
    } else {
      integration.integrationType = integrationType;
    }

    await integration.save();
    console.log('Integration saved successfully for user:', userId);

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?success=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    console.error('Full error stack:', error.stack);
    const errorMessage = error.response?.data?.error_description || 
                        error.response?.data?.error || 
                        error.message || 
                        'connection_failed';
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?error=${encodeURIComponent(errorMessage)}`
    );
  }
};

/**
 * Get user's integration status
 */
export const getIntegrationStatus = async (req, res) => {
  try {
    const integration = await MicrosoftIntegration.findOne({ userId: req.user._id });

    if (!integration) {
      return res.json({
        outlook: { isConnected: false },
        teams: { isConnected: false },
        settings: {
          sendEmailNotifications: true,
          sendTeamsNotifications: true,
          notifyOnIssueCreate: true,
          notifyOnIssueUpdate: true,
          notifyOnComment: true,
          notifyOnStatusChange: true,
          notifyOnAssignment: true,
        },
      });
    }

    res.json({
      outlook: {
        isConnected: integration.outlook?.isConnected || false,
        email: integration.outlook?.email || null,
      },
      teams: {
        isConnected: integration.teams?.isConnected || false,
        teamId: integration.teams?.teamId || null,
        channelId: integration.teams?.channelId || null,
      },
      settings: integration.settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get user's Teams
 */
export const getUserTeamsList = async (req, res) => {
  try {
    const integration = await MicrosoftIntegration.findOne({
      userId: req.user._id,
      'teams.isConnected': true,
    });

    if (!integration) {
      return res.status(400).json({ message: 'Teams not connected' });
    }

    const accessToken = await getValidAccessToken(
      integration,
      process.env.MICROSOFT_CLIENT_ID,
      process.env.MICROSOFT_CLIENT_SECRET,
      process.env.MICROSOFT_TENANT_ID
    );

    const teams = await getUserTeams(accessToken);
    res.json({ teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get channels for a team
 */
export const getChannels = async (req, res) => {
  try {
    const { teamId } = req.params;
    const integration = await MicrosoftIntegration.findOne({
      userId: req.user._id,
      'teams.isConnected': true,
    });

    if (!integration) {
      return res.status(400).json({ message: 'Teams not connected' });
    }

    const accessToken = await getValidAccessToken(
      integration,
      process.env.MICROSOFT_CLIENT_ID,
      process.env.MICROSOFT_CLIENT_SECRET,
      process.env.MICROSOFT_TENANT_ID
    );

    const channels = await getTeamChannels(accessToken, teamId);
    console.log(`Returning ${channels.length} channels for team ${teamId}`);
    res.json({ channels: channels || [] });
  } catch (error) {
    console.error('Error in getChannels controller:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Configure Teams channel
 */
export const configureTeamsChannel = async (req, res) => {
  try {
    const { teamId, channelId } = req.body;
    const integration = await MicrosoftIntegration.findOne({ userId: req.user._id });

    if (!integration || !integration.teams?.isConnected) {
      return res.status(400).json({ message: 'Teams not connected' });
    }

    integration.teams.teamId = teamId;
    integration.teams.channelId = channelId;
    await integration.save();

    res.json({ message: 'Teams channel configured successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update integration settings
 */
export const updateSettings = async (req, res) => {
  try {
    const integration = await MicrosoftIntegration.findOne({ userId: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    integration.settings = { ...integration.settings, ...req.body };
    await integration.save();

    res.json({ message: 'Settings updated successfully', settings: integration.settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Disconnect integration
 */
export const disconnectIntegration = async (req, res) => {
  try {
    const { type } = req.body; // 'outlook', 'teams', or 'both'
    const integration = await MicrosoftIntegration.findOne({ userId: req.user._id });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    if (type === 'outlook' || type === 'both') {
      integration.outlook = {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        email: null,
      };
    }

    if (type === 'teams' || type === 'both') {
      integration.teams = {
        isConnected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        teamId: null,
        channelId: null,
        tenantId: null,
      };
    }

    if (type === 'both') {
      integration.integrationType = 'both';
    }

    await integration.save();
    res.json({ message: 'Integration disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Test Microsoft configuration (for debugging)
 */
export const testMicrosoftConfig = async (req, res) => {
  try {
    // Only return configuration status, not actual values (security)
    const config = {
      hasClientId: !!process.env.MICROSOFT_CLIENT_ID,
      hasClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
      hasTenantId: !!process.env.MICROSOFT_TENANT_ID,
      // Only show non-sensitive URLs
      backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
      redirectUri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/microsoft/callback`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    };

    res.json({
      message: 'Configuration check',
      config,
      status: config.hasClientId && config.hasClientSecret && config.hasTenantId ? 'ok' : 'missing_values',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

