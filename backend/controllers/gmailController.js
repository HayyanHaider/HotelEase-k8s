const { getAuthUrl, getTokensFromCode, saveTokens, revokeAuthorization, isGmailAuthorized } = require('../utils/gmailOAuthService');
const UserModel = require('../models/userModel');

// Initiate Gmail OAuth2 authorization
const initiateGmailAuth = async (req, res) => {
    try {
    const userId = req.user?.userId;
    
      if (!userId) {
      return res.status(401).json({
         success: false,
          message: 'User not authenticated'
      });
     }

    const authUrl = getAuthUrl(userId);
    
      if (!authUrl) {
      return res.status(500).json({
         success: false,
          message: 'Gmail OAuth2 not configured. Please configure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in environment variables.'
      });
     }

    return res.json({
       success: true,
        authUrl: authUrl,
      message: 'Please visit the authUrl to authorize Gmail access'
     });
    } catch (error) {
    console.error('Error initiating Gmail auth:', error);
     return res.status(500).json({
        success: false,
      message: 'Error initiating Gmail authorization'
     });
    }
};

// Handle Gmail OAuth2 callback
const handleGmailCallback = async (req, res) => {
   try {
      const { code, state, error } = req.query;

     if (error) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?gmail_auth=error&error=${encodeURIComponent(error)}`);
    }

      if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?gmail_auth=error&error=missing_code_or_state`);
     }

    // Decode state to get userId
     let userId;
      try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
       userId = decodedState.userId;
      } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?gmail_auth=error&error=invalid_state`);
     }

    if (!userId) {
       return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?gmail_auth=error&error=missing_user_id`);
      }

     // Exchange code for tokens
      const tokens = await getTokensFromCode(code);
    
     // Save tokens to user
      await saveTokens(userId, tokens);

     return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?gmail_auth=success`);
    } catch (error) {
    console.error('Error handling Gmail callback:', error);
     return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?gmail_auth=error&error=${encodeURIComponent(error.message)}`);
    }
};

// Check Gmail authorization status
const checkGmailStatus = async (req, res) => {
   try {
      const userId = req.user?.userId;
    
     if (!userId) {
        return res.status(401).json({
        success: false,
         message: 'User not authenticated'
        });
    }

      const authorized = await isGmailAuthorized(userId);
    const user = await UserModel.findById(userId).select('gmailAuthorized gmailAuthorizedAt email');

      return res.json({
      success: true,
       authorized: authorized,
        authorizedAt: user?.gmailAuthorizedAt || null,
      email: user?.email || null
     });
    } catch (error) {
    console.error('Error checking Gmail status:', error);
     return res.status(500).json({
        success: false,
      message: 'Error checking Gmail authorization status'
     });
    }
};

// Revoke Gmail authorization
const revokeGmailAuth = async (req, res) => {
   try {
      const userId = req.user?.userId;
    
     if (!userId) {
        return res.status(401).json({
        success: false,
         message: 'User not authenticated'
        });
    }

      const result = await revokeAuthorization(userId);

     return res.json(result);
    } catch (error) {
    console.error('Error revoking Gmail auth:', error);
     return res.status(500).json({
        success: false,
      message: 'Error revoking Gmail authorization'
     });
    }
};

module.exports = {
  initiateGmailAuth,
   handleGmailCallback,
    checkGmailStatus,
  revokeGmailAuth
};

