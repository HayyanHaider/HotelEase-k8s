const { google } = require('googleapis');
const UserModel = require('../models/userModel');

// Gmail OAuth2 Configuration
const getOAuth2Client = () => {
    const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
   const redirectUri = process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/auth/gmail/callback';

  if (!clientId || !clientSecret) {
     console.warn('⚠️  Gmail OAuth2 credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env');
      return null;
  }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Get authorization URL for Gmail OAuth2
const getAuthUrl = (userId) => {
   const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
    return null;
   }

  const scopes = [
     'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
   ];

  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  
    const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
     scope: scopes,
      state: state,
    prompt: 'consent' // Force consent screen to get refresh token
   });

  return authUrl;
};

// Exchange authorization code for tokens
const getTokensFromCode = async (code) => {
    try {
    const oauth2Client = getOAuth2Client();
     if (!oauth2Client) {
        throw new Error('Gmail OAuth2 not configured');
    }

      const { tokens } = await oauth2Client.getToken(code);
    return tokens;
   } catch (error) {
      console.error('Error getting tokens from code:', error);
    throw error;
   }
};

// Get OAuth2 client with user's tokens
const getAuthenticatedClient = async (userId) => {
  try {
     const user = await UserModel.findById(userId);
      if (!user || !user.gmailTokens) {
      throw new Error('User not found or Gmail not authorized');
     }

    const oauth2Client = getOAuth2Client();
     if (!oauth2Client) {
        throw new Error('Gmail OAuth2 not configured');
    }

      oauth2Client.setCredentials({
      access_token: user.gmailTokens.access_token,
       refresh_token: user.gmailTokens.refresh_token,
        expiry_date: user.gmailTokens.expiry_date
    });

      // Check if token needs refresh
    if (user.gmailTokens.expiry_date && Date.now() >= user.gmailTokens.expiry_date) {
       const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in database
       user.gmailTokens = {
          access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || user.gmailTokens.refresh_token,
         expiry_date: credentials.expiry_date,
          token_type: credentials.token_type || 'Bearer'
      };
       await user.save();

      oauth2Client.setCredentials(credentials);
     }

    return oauth2Client;
   } catch (error) {
      console.error('Error getting authenticated client:', error);
    throw error;
   }
};

// Save tokens to user model
const saveTokens = async (userId, tokens) => {
  try {
     const user = await UserModel.findById(userId);
      if (!user) {
      throw new Error('User not found');
     }

    user.gmailTokens = {
       access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
       token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope
    };
     user.gmailAuthorized = true;
      user.gmailAuthorizedAt = new Date();

     await user.save();
      return true;
  } catch (error) {
     console.error('Error saving tokens:', error);
      throw error;
  }
};

// Revoke Gmail authorization
const revokeAuthorization = async (userId) => {
    try {
    const user = await UserModel.findById(userId);
     if (!user || !user.gmailTokens) {
        return { success: false, message: 'Gmail not authorized' };
    }

      const oauth2Client = getOAuth2Client();
    if (oauth2Client) {
       oauth2Client.setCredentials({
          access_token: user.gmailTokens.access_token,
        refresh_token: user.gmailTokens.refresh_token
       });

      try {
         await oauth2Client.revokeCredentials();
        } catch (error) {
        console.error('Error revoking credentials:', error);
       }
      }

     user.gmailTokens = undefined;
      user.gmailAuthorized = false;
    user.gmailAuthorizedAt = undefined;
     await user.save();

    return { success: true, message: 'Gmail authorization revoked' };
   } catch (error) {
      console.error('Error revoking authorization:', error);
    throw error;
   }
};

// Check if user has Gmail authorized
const isGmailAuthorized = async (userId) => {
  try {
     const user = await UserModel.findById(userId);
      return !!(user && user.gmailAuthorized && user.gmailTokens);
  } catch (error) {
     console.error('Error checking Gmail authorization:', error);
      return false;
  }
};

module.exports = {
   getAuthUrl,
    getTokensFromCode,
  getAuthenticatedClient,
   saveTokens,
    revokeAuthorization,
  isGmailAuthorized
};

