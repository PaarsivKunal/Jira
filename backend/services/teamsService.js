import axios from 'axios';

/**
 * Send a notification card to Microsoft Teams via Webhook
 * @param {Object} issue - The issue object triggering the notification
 * @param {String} action - The action performed (e.g., 'created', 'updated')
 */
export const sendTeamsNotification = async (issue, action) => {
    try {
        const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('TEAMS_WEBHOOK_URL is not defined. Skipping Teams notification.');
            return;
        }

        const color = action === 'created' ? '00FF00' : 'FFA500'; // Green for create, Orange for update
        const title = `Issue ${action.charAt(0).toUpperCase() + action.slice(1)}: ${issue.key} - ${issue.title}`;

        const card = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": color,
            "summary": title,
            "sections": [{
                "activityTitle": title,
                "activitySubtitle": `Project: ${issue.projectId.name || 'Unknown Project'}`,
                "facts": [
                    { "name": "Status", "value": issue.status },
                    { "name": "Priority", "value": issue.priority },
                    { "name": "Assignee", "value": issue.assignee ? issue.assignee.name : 'Unassigned' },
                    { "name": "Reporter", "value": issue.reporter ? issue.reporter.name : 'Unknown' }
                ],
                "markdown": true
            }],
            "potentialAction": [{
                "@type": "OpenUri",
                "name": "View Issue",
                "targets": [{
                    "os": "default",
                    "uri": `${process.env.FRONTEND_URL}/issues/${issue._id}`
                }]
            }]
        };

        await axios.post(webhookUrl, card);
        console.log(`Teams notification sent for issue ${issue.key}`);

    } catch (error) {
        console.error('Failed to send Teams notification:', error.message);
        // Don't throw, just log, so we don't block the main flow
    }
};

export default sendTeamsNotification;
