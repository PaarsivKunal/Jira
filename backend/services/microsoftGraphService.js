import axios from 'axios';

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Get access token using refresh token
 */
export const refreshAccessToken = async (refreshToken, clientId, clientSecret, tenantId) => {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/.default',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresIn: response.data.expires_in,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error refreshing token:', error.response?.data || error.message);
    }
    throw new Error('Failed to refresh access token');
  }
};

/**
 * Get valid access token (refresh if needed)
 */
export const getValidAccessToken = async (integration, clientId, clientSecret, tenantId) => {
  const now = new Date();
  const expiresAt = integration.outlook?.expiresAt || integration.teams?.expiresAt;

  if (expiresAt && expiresAt > now) {
    return integration.outlook?.accessToken || integration.teams?.accessToken;
  }

  // Token expired, refresh it
  const refreshToken = integration.outlook?.refreshToken || integration.teams?.refreshToken;
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const tokenData = await refreshAccessToken(refreshToken, clientId, clientSecret, tenantId);
  
  // Update integration with new tokens
  if (integration.outlook?.isConnected) {
    integration.outlook.accessToken = tokenData.accessToken;
    integration.outlook.refreshToken = tokenData.refreshToken;
    integration.outlook.expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
  }
  if (integration.teams?.isConnected) {
    integration.teams.accessToken = tokenData.accessToken;
    integration.teams.refreshToken = tokenData.refreshToken;
    integration.teams.expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
  }
  
  await integration.save();
  
  return tokenData.accessToken;
};

/**
 * Send email via Outlook
 */
export const sendOutlookEmail = async (accessToken, to, subject, body, isHtml = true) => {
  try {
    const message = {
      message: {
        subject,
        body: {
          contentType: isHtml ? 'HTML' : 'Text',
          content: body,
        },
        toRecipients: Array.isArray(to) 
          ? to.map(email => ({ emailAddress: { address: email } }))
          : [{ emailAddress: { address: to } }],
      },
      saveToSentItems: true,
    };

    const response = await axios.post(
      `${GRAPH_API_BASE}/me/sendMail`,
      message,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending Outlook email:', error.response?.data || error.message);
    }
    throw new Error('Failed to send email via Outlook');
  }
};

/**
 * Create calendar event in Outlook
 */
export const createOutlookEvent = async (accessToken, eventData) => {
  try {
    const event = {
      subject: eventData.subject,
      body: {
        contentType: 'HTML',
        content: eventData.description || '',
      },
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      location: {
        displayName: eventData.location || '',
      },
      attendees: eventData.attendees?.map(email => ({
        emailAddress: { address: email },
        type: 'required',
      })) || [],
      isOnlineMeeting: eventData.isOnlineMeeting || false,
      onlineMeetingProvider: eventData.isOnlineMeeting ? 'teamsForBusiness' : null,
    };

    const response = await axios.post(
      `${GRAPH_API_BASE}/me/events`,
      event,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error creating Outlook event:', error.response?.data || error.message);
    }
    throw new Error('Failed to create calendar event');
  }
};

/**
 * Send message to Teams channel
 */
export const sendTeamsMessage = async (accessToken, teamId, channelId, message) => {
  try {
    const response = await axios.post(
      `${GRAPH_API_BASE}/teams/${teamId}/channels/${channelId}/messages`,
      {
        body: {
          contentType: 'html',
          content: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending Teams message:', error.response?.data || error.message);
    }
    throw new Error('Failed to send Teams message');
  }
};

/**
 * Send adaptive card to Teams
 */
export const sendTeamsAdaptiveCard = async (accessToken, teamId, channelId, card) => {
  try {
    const response = await axios.post(
      `${GRAPH_API_BASE}/teams/${teamId}/channels/${channelId}/messages`,
      {
        body: {
          contentType: 'html',
          content: `<attachment id="${Date.now()}"></attachment>`,
        },
        attachments: [
          {
            id: `${Date.now()}`,
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: JSON.stringify(card),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending Teams adaptive card:', error.response?.data || error.message);
    }
    throw new Error('Failed to send adaptive card');
  }
};

/**
 * Get user's Teams
 */
export const getUserTeams = async (accessToken) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me/joinedTeams`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.value;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching Teams:', error.response?.data || error.message);
    }
    throw new Error('Failed to fetch Teams');
  }
};

/**
 * Get channels for a team
 */
export const getTeamChannels = async (accessToken, teamId) => {
  try {
    const response = await axios.get(
      `${GRAPH_API_BASE}/teams/${teamId}/channels`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const channels = response.data.value || [];
    
    // Filter out private channels if needed (they require different permissions)
    // Only return standard channels that are accessible
    const accessibleChannels = channels.filter(channel => 
      channel.membershipType === 'standard' || channel.membershipType === 'shared'
    );

    return accessibleChannels.length > 0 ? accessibleChannels : channels; // Return all if filtering removed everything
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching channels:', error.response?.data || error.message);
      console.error('Team ID:', teamId);
      console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    }
    
    // Provide more specific error messages
    if (error.response?.status === 403) {
      throw new Error('Insufficient permissions to view channels. Please check API permissions in Azure Portal.');
    } else if (error.response?.status === 404) {
      throw new Error('Team not found or you do not have access to this team.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please reconnect Teams integration.');
    }
    
    throw new Error(error.response?.data?.error?.message || 'Failed to fetch channels');
  }
};

