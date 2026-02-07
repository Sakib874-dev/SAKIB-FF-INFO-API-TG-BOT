const axios = require('axios');
const config = require('../config.json');

module.exports = {
    name: 'ban',
    version: '1.0.0',
    author: 'TCX-SAKIB',
    usePrefix: true,
    adminOnly: false,
    allowedGroupOnly: true,
    verify: true,
    guide: `Use ${config.botPrefix}ban <uid> to check ban status.`, 
    async execute(ctx) {
        const args = ctx.message.text.split(' ').slice(1);
        
        if (args.length < 1) {
            return ctx.reply(`Usage: ${config.botPrefix}ban <uid>`);
        }

        const uid = args[0];
        
        if (!/^\d+$/.test(uid)) {
            return ctx.reply('Invalid UID. UID should be numbers only.');
        }

        const waitMessage = await ctx.reply('Checking ban status...');

        try {
            const response = await axios.get(config.banCheckUrl, {
                params: {
                    key: 'SAKIB-API-80-DAYS',
                    uid: uid
                },
                timeout: 45000
            });

            const data = response.data;
            
            if (!data.success) {
                return ctx.reply(`Error: ${data.message || 'Failed to check ban status'}\nUID: ${uid}`, { 
                    reply_to_message_id: ctx.message.message_id 
                });
            }

            let message = `🛡️ *Ban Status Check*\n\n`;
            message += `🆔 UID: \`${uid}\`\n`;
            message += `✅ API Status: Successful\n\n`;
            
            if (data.isBanned) {
                message += `🔴 *ACCOUNT BANNED* 🔴\n\n`;
                
                if (data.banDetails) {
                    message += `📜 *Ban Details:*\n`;
                    message += `• Reason: ${data.banDetails.reason || 'Not specified'}\n`;
                    message += `• Date: ${data.banDetails.date || 'Unknown'}\n`;
                    message += `• Duration: ${data.banDetails.duration || 'Permanent'}\n`;
                }
            } else {
                message += `🟢 *ACCOUNT NOT BANNED* 🟢\n`;
            }
            
            if (data.lastChecked) {
                message += `\n📅 Last Checked: ${data.lastChecked}`;
            }
            
            if (data.message) {
                message += `\n\n📝 Note: ${data.message}`;
            }

            await ctx.reply(message, { 
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id 
            });
            
        } catch (error) {
            let errorMessage = `Failed to check ban status for UID: ${uid}\n\n`;
            
            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage += 'API endpoint not found.';
                } else if (error.response.status === 400) {
                    errorMessage += 'Bad request. Check UID format.';
                } else {
                    errorMessage += `Server error: ${error.response.status}`;
                }
                
                if (error.response.data && error.response.data.message) {
                    errorMessage += `\nMessage: ${error.response.data.message}`;
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage += 'Request timed out.';
            } else if (error.request) {
                errorMessage += 'No response from server.';
            } else {
                errorMessage += `Error: ${error.message}`;
            }
            
            await ctx.reply(errorMessage, { 
                reply_to_message_id: ctx.message.message_id 
            });
            
        } finally {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, waitMessage.message_id);
            } catch (deleteError) {
                console.log('Could not delete wait message');
            }
        }
    }
};