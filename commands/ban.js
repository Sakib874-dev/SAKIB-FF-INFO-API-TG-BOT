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
        
        if (!/^\d{7,10}$/.test(uid)) {
            return ctx.reply('Invalid UID. UID should be 7-10 digits.');
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

            if (response.headers['content-type'] && response.headers['content-type'].includes('image')) {
                await ctx.replyWithPhoto(
                    { source: Buffer.from(response.data) }, 
                    { 
                        reply_to_message_id: ctx.message.message_id,
                        caption: `UID: ${uid}`
                    }
                );
            } else {
                try {
                    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
                    
                    if (data.success) {
                        const message = `
🛡️ Ban Status Check 🛡️

🆔 UID: ${uid}
✅ API Status: ${data.success ? 'Successful' : 'Failed'}

${data.isBanned ? '🔴 ACCOUNT BANNED 🔴' : '🟢 ACCOUNT CLEAN 🟢'}

${data.banDetails ? `
📜 Ban Details:
• Reason: ${data.banDetails.reason || 'N/A'}
• Date: ${data.banDetails.date || 'N/A'}
• Duration: ${data.banDetails.duration || 'N/A'}
` : ''}

${data.lastChecked ? `📅 Last Checked: ${data.lastChecked}` : ''}
${data.message ? `\n📝 Note: ${data.message}` : ''}
                        `.trim();
                        
                        await ctx.reply(message, { 
                            reply_to_message_id: ctx.message.message_id 
                        });
                    } else {
                        await ctx.reply(`API Error: ${data.message || 'Unknown error'}\nUID: ${uid}`, { 
                            reply_to_message_id: ctx.message.message_id 
                        });
                    }
                } catch (jsonError) {
                    await ctx.reply(`Response:\n${response.data.toString().substring(0, 4000)}\nUID: ${uid}`, { 
                        reply_to_message_id: ctx.message.message_id 
                    });
                }
            }
            
        } catch (error) {
            let errorMessage = `Failed to check ban status for UID: ${uid}\n\n`;
            
            if (error.code === 'ECONNABORTED') {
                errorMessage += 'Request timed out.';
            } else if (error.response) {
                errorMessage += `Server Error: ${error.response.status}`;
            } else if (error.request) {
                errorMessage += 'No response from server.';
            } else {
                errorMessage += 'Please try again later.';
            }
            
            await ctx.reply(errorMessage, { 
                reply_to_message_id: ctx.message.message_id 
            });
            
        } finally {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, waitMessage.message_id);
            } catch (deleteError) {
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id, 
                        waitMessage.message_id, 
                        null, 
                        'Check completed!'
                    );
                } catch (editError) {}
            }
        }
    }
};