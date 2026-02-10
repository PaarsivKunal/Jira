import nodemailer from 'nodemailer';
import MicrosoftIntegration from '../models/MicrosoftIntegration.js';
import User from '../models/User.js';
import { getValidAccessToken, sendOutlookEmail } from '../services/microsoftGraphService.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send email - tries recipient's Outlook first if they have it connected, otherwise uses SMTP
 */
const sendEmail = async (recipientEmail, subject, htmlBody, textBody) => {
  try {
    // Normalize email to lowercase for lookup
    const normalizedEmail = Array.isArray(recipientEmail) 
      ? recipientEmail[0].toLowerCase() 
      : recipientEmail.toLowerCase();
    
    // Find user by email to check their Outlook integration
    const recipientUser = await User.findOne({ email: normalizedEmail });
    
    // Check if recipient has Outlook connected
    if (recipientUser) {
      const integration = await MicrosoftIntegration.findOne({
        userId: recipientUser._id,
        'outlook.isConnected': true,
      });

      if (integration && integration.settings.sendEmailNotifications) {
        try {
          const accessToken = await getValidAccessToken(
            integration,
            process.env.MICROSOFT_CLIENT_ID,
            process.env.MICROSOFT_CLIENT_SECRET,
            process.env.MICROSOFT_TENANT_ID
          );

          // Use recipient's Outlook email (from integration) or their registered email
          const outlookEmail = integration.outlook.email || normalizedEmail;
          await sendOutlookEmail(accessToken, outlookEmail, subject, htmlBody, true);
          return { success: true, method: 'outlook' };
        } catch (outlookError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Outlook email failed, falling back to SMTP:', outlookError.message);
          }
          // Fall through to SMTP
        }
      }
    }

    // Fallback to SMTP
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Paarsiv Team" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: Array.isArray(recipientEmail) ? recipientEmail.join(', ') : recipientEmail,
      subject,
      html: htmlBody,
      text: textBody,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, method: 'smtp' };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending email:', error);
    }
    throw error;
  }
};

export const sendIssueNotification = async (issue, action, recipientEmail) => {
  try {
    const actionText = action.charAt(0).toUpperCase() + action.slice(1);
    // Support multiple assignees
    const to = recipientEmail || issue.assignees?.[0]?.email || issue.assignee?.email || issue.reporter?.email;

    if (!to) {
      return;
    }

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0052CC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Paarsiv</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Issue ${actionText}</h2>
          <p>The following issue has been <strong>${action}</strong>:</p>
          <div style="background: #fff; padding: 15px; border-radius: 4px; border-left: 4px solid #0052CC; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0052CC;">${issue.key}: ${issue.title}</h3>
            <p><strong>Status:</strong> <span style="text-transform: capitalize;">${issue.status?.replace('_', ' ')}</span></p>
            <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${issue.priority}</span></p>
            <p><strong>Assignee${issue.assignees?.length > 1 ? 's' : ''}:</strong> ${issue.assignees?.map(a => a.name).join(', ') || issue.assignee?.name || 'Unassigned'}</p>
            <p><strong>Project:</strong> ${issue.projectId?.name || 'Unknown'}</p>
          </div>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL}/issues/${issue._id}" style="display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Issue</a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Paarsiv. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Issue ${actionText}: [${issue.key}] ${issue.title}
      
      The following issue has been ${action}:
      
      ${issue.key}: ${issue.title}
      Status: ${issue.status}
      Priority: ${issue.priority}
      Assignee: ${issue.assignee?.name || 'Unassigned'}
      Project: ${issue.projectId?.name || 'Unknown'}
      
      View Issue: ${process.env.FRONTEND_URL}/issues/${issue._id}
    `;

    // Send to recipient's email (will use their Outlook if connected)
    const result = await sendEmail(to, `Issue ${actionText}: [${issue.key}] ${issue.title}`, htmlBody, textBody);
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending issue notification email: ', error);
    }
    // Log but don't throw to avoid blocking issue creation
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification when a comment is added to an issue
 */
export const sendCommentNotification = async (issue, comment, commenter) => {
  try {
    // Get all users who should be notified:
    // 1. Issue assignee (if exists and not the commenter)
    // 2. Issue reporter (if not the commenter)
    // 3. All other users who commented on this issue (if not the commenter)
    
    const recipients = new Set();
    
    // Add assignees (support multiple)
    if (issue.assignees && Array.isArray(issue.assignees)) {
      issue.assignees.forEach(assignee => {
        if (assignee?.email && assignee.email !== commenter.email) {
          recipients.add(assignee.email);
        }
      });
    } else if (issue.assignee?.email && issue.assignee.email !== commenter.email) {
      recipients.add(issue.assignee.email);
    }
    
    // Add reporter
    if (issue.reporter?.email && issue.reporter.email !== commenter.email) {
      recipients.add(issue.reporter.email);
    }
    
    // Get all other commenters
    const Comment = (await import('../models/Comment.js')).default;
    const allComments = await Comment.find({ issueId: issue._id })
      .populate('userId', 'email')
      .select('userId');
    
    allComments.forEach((c) => {
      if (c.userId?.email && c.userId.email !== commenter.email) {
        recipients.add(c.userId.email);
      }
    });
    
    if (recipients.size === 0) {
      return { success: false, message: 'No recipients' };
    }
    
    const recipientEmails = Array.from(recipients);
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0052CC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Paarsiv</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">New Comment Added</h2>
          <p><strong>${commenter.name}</strong> added a comment on issue:</p>
          
          <div style="background-color: #fff; border-left: 4px solid #0052CC; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #0052CC;">${issue.key}: ${issue.title}</h3>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${issue.status?.replace('_', ' ')}</span></p>
            <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${issue.priority}</span></p>
            <p style="margin: 5px 0;"><strong>Assignee${issue.assignees?.length > 1 ? 's' : ''}:</strong> ${issue.assignees?.map(a => a.name).join(', ') || issue.assignee?.name || 'Unassigned'}</p>
            <p style="margin: 5px 0;"><strong>Project:</strong> ${issue.projectId?.name || 'Unknown'}</p>
          </div>
          
          <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Comment by ${commenter.name}:</p>
            <div style="color: #333; white-space: pre-wrap;">${comment.content}</div>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL}/issues/${issue._id}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Issue & Comment
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Paarsiv. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    
    const textBody = `
      New Comment on [${issue.key}] ${issue.title}
      
      ${commenter.name} added a comment on issue:
      
      ${issue.key}: ${issue.title}
      Status: ${issue.status}
      Priority: ${issue.priority}
      Assignee${issue.assignees?.length > 1 ? 's' : ''}: ${issue.assignees?.map(a => a.name).join(', ') || issue.assignee?.name || 'Unassigned'}
      Project: ${issue.projectId?.name || 'Unknown'}
      
      Comment by ${commenter.name}:
      ${comment.content}
      
      View Issue: ${process.env.FRONTEND_URL}/issues/${issue._id}
    `;
    
    // Send to all recipients (will use their Outlook if connected)
    const emailPromises = recipientEmails.map(email => 
      sendEmail(email, `New Comment on [${issue.key}] ${issue.title}`, htmlBody, textBody)
    );
    const results = await Promise.all(emailPromises);
    
    return { success: true, recipients: recipientEmails, results };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending comment notification email: ', error);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification when an issue is assigned to a user
 */
export const sendAssignmentNotification = async (issue, assignee, assignedBy) => {
  try {
    if (!assignee?.email) {
      return { success: false, message: 'No assignee email' };
    }
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0052CC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Paarsiv</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">New Assignment</h2>
          <p>You've been assigned to an issue by <strong>${assignedBy.name}</strong>:</p>
          
          <div style="background-color: #fff; border-left: 4px solid #0052CC; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #0052CC;">${issue.key}: ${issue.title}</h3>
            ${issue.description ? `<p style="color: #666; margin: 10px 0;">${issue.description}</p>` : ''}
            <div style="margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Type:</strong> <span style="text-transform: capitalize;">${issue.type}</span></p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${issue.status?.replace('_', ' ')}</span></p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${issue.priority}</span></p>
              <p style="margin: 5px 0;"><strong>Reporter:</strong> ${issue.reporter?.name || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Project:</strong> ${issue.projectId?.name || 'Unknown'}</p>
              ${issue.dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(issue.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL}/issues/${issue._id}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Issue
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Paarsiv. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    
    const textBody = `
      You've been assigned to [${issue.key}] ${issue.title}
      
      You've been assigned to an issue by ${assignedBy.name}:
      
      ${issue.key}: ${issue.title}
      ${issue.description ? `\n${issue.description}\n` : ''}
      Type: ${issue.type}
      Status: ${issue.status}
      Priority: ${issue.priority}
      Reporter: ${issue.reporter?.name || 'Unknown'}
      Project: ${issue.projectId?.name || 'Unknown'}
      ${issue.dueDate ? `Due Date: ${new Date(issue.dueDate).toLocaleDateString()}` : ''}
      
      View Issue: ${process.env.FRONTEND_URL}/issues/${issue._id}
    `;
    
    // Send to assignee's email (will use their Outlook if connected)
    const result = await sendEmail(assignee.email, `You've been assigned to [${issue.key}] ${issue.title}`, htmlBody, textBody);
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending assignment notification email: ', error);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send email notification when an issue is created (to assignee if assigned)
 */
export const sendIssueCreatedNotification = async (issue, assignee) => {
  try {
    if (!assignee?.email) {
      return { success: false, message: 'No assignee email' };
    }
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0052CC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Paarsiv</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">New Issue Created</h2>
          <p>A new issue has been created and assigned to you:</p>
          
          <div style="background-color: #fff; border-left: 4px solid #0052CC; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #0052CC;">${issue.key}: ${issue.title}</h3>
            ${issue.description ? `<p style="color: #666; margin: 10px 0;">${issue.description}</p>` : ''}
            <div style="margin-top: 15px;">
              <p style="margin: 5px 0;"><strong>Type:</strong> <span style="text-transform: capitalize;">${issue.type}</span></p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${issue.status?.replace('_', ' ')}</span></p>
              <p style="margin: 5px 0;"><strong>Priority:</strong> <span style="text-transform: capitalize;">${issue.priority}</span></p>
              <p style="margin: 5px 0;"><strong>Reporter:</strong> ${issue.reporter?.name || 'Unknown'}</p>
              <p style="margin: 5px 0;"><strong>Project:</strong> ${issue.projectId?.name || 'Unknown'}</p>
              ${issue.dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(issue.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.FRONTEND_URL}/issues/${issue._id}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View Issue
            </a>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Paarsiv. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    
    const textBody = `
      New Issue Created: [${issue.key}] ${issue.title}
      
      A new issue has been created and assigned to you:
      
      ${issue.key}: ${issue.title}
      ${issue.description ? `\n${issue.description}\n` : ''}
      Type: ${issue.type}
      Status: ${issue.status}
      Priority: ${issue.priority}
      Reporter: ${issue.reporter?.name || 'Unknown'}
      Project: ${issue.projectId?.name || 'Unknown'}
      ${issue.dueDate ? `Due Date: ${new Date(issue.dueDate).toLocaleDateString()}` : ''}
      
      View Issue: ${process.env.FRONTEND_URL}/issues/${issue._id}
    `;
    
    // Send to assignee's email (will use their Outlook if connected)
    const result = await sendEmail(assignee.email, `New Issue Assigned: [${issue.key}] ${issue.title}`, htmlBody, textBody);
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending issue creation notification email: ', error);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email with password reset link
 */
export const sendWelcomeEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0052CC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to Paarsiv!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Welcome, ${user.name}!</h2>
          <p>Thank you for registering with Paarsiv. We're excited to have you on board!</p>
          
          <div style="background-color: #fff; border-left: 4px solid #0052CC; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 5px 0;"><strong>Your Account Details:</strong></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            ${user.department ? `<p style="margin: 5px 0;"><strong>Department:</strong> ${user.department.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>` : ''}
          </div>
          
          <p style="margin-top: 25px;">To get started, please set your password by clicking the button below:</p>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Your Password
            </a>
          </div>
          
          <p style="margin-top: 25px; font-size: 12px; color: #666;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #0052CC; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            <strong>Note:</strong> This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Paarsiv. All rights reserved.</p>
          <p>Visit us at: <a href="${process.env.FRONTEND_URL}" style="color: #0052CC;">${process.env.FRONTEND_URL}</a></p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Welcome to Paarsiv!
      
      Welcome, ${user.name}!
      
      Thank you for registering with Paarsiv. We're excited to have you on board!
      
      Your Account Details:
      Email: ${user.email}
      Role: ${user.role}
      ${user.department ? `Department: ${user.department}` : ''}
      
      To get started, please set your password by visiting:
      ${resetUrl}
      
      This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      
      Visit us at: ${process.env.FRONTEND_URL}
      
      © ${new Date().getFullYear()} Paarsiv. All rights reserved.
    `;

    const result = await sendEmail(user.email, 'Welcome to Paarsiv - Set Your Password', htmlBody, textBody);
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending welcome email: ', error);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #0052CC; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">Paarsiv</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          
          <div style="text-align: center; margin-top: 25px;">
            <a href="${resetUrl}" 
               style="display: inline-block; padding: 12px 24px; background-color: #0052CC; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="margin-top: 25px; font-size: 12px; color: #666;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #0052CC; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="margin-top: 20px; font-size: 12px; color: #999;">
            <strong>Note:</strong> This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Paarsiv. All rights reserved.</p>
          <p>Visit us at: <a href="${process.env.FRONTEND_URL}" style="color: #0052CC;">${process.env.FRONTEND_URL}</a></p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Password Reset Request
      
      Hello ${user.name},
      
      You requested to reset your password. Visit the link below to set a new password:
      
      ${resetUrl}
      
      This link will expire in 24 hours. If you didn't request a password reset, please ignore this email.
      
      Visit us at: ${process.env.FRONTEND_URL}
      
      © ${new Date().getFullYear()} Paarsiv. All rights reserved.
    `;

    const result = await sendEmail(user.email, 'Password Reset Request', htmlBody, textBody);
    
    return result;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error sending password reset email: ', error);
    }
    throw error;
  }
};

