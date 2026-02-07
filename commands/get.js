const axios = require('axios')
const config = require('../config.json')

module.exports = {
    name: 'get',
    version: '2.0.0',
    author: 'TCX-SAKIB',
    usePrefix: true,
    adminOnly: false,
    allowedGroupOnly: false,
    verify: false,
    guide: '👤 ANY ACCOUNT INFORMATION\n   ├── Format: get {uid}\n   ├── Example: get 242918984\n   └── All Regions Supported',
    async execute(ctx) {
        const args = ctx.message.text.split(' ').slice(1)
        
        if (args.length < 1) {
            return ctx.reply(
                `📋 *Usage:* ${config.botPrefix}get <uid>\n` +
                `📝 *Example:* ${config.botPrefix}get 242918984\n\n` +
                `🌍 *All Regions Supported*`,
                { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id }
            )
        }

        const uid = args[0]

        if (!uid || isNaN(uid) || uid.length < 6) {
            return ctx.reply(
                `❌ *Invalid UID*\n\n` +
                `🔹 You entered: ${uid}\n` +
                `✅ UID must be:\n` +
                `• A valid number\n` +
                `• Minimum 6 digits\n\n` +
                `📝 *Example:* ${config.botPrefix}get 242918984`,
                { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id }
            )
        }

        try {
            const processingMsg = await ctx.reply(`🔄 *Processing UID ${uid}...*`, {
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id
            })

            const regions = ['BD', 'IN', 'SG', 'VN', 'TH', 'ID', 'MY', 'PH', 'BR', 'ME', 'EU', 'CIS', 'TR']
            let data = null
            let foundRegion = 'Unknown'

            for (const region of regions) {
                try {
                    const apiUrl = `https://sakib-ff-info-api.vercel.app/player-info?region=${region}&uid=${uid}`
                    const response = await axios.get(apiUrl, { timeout: 5000 })
                    
                    if (response.data && response.data.basicInfo) {
                        data = response.data
                        foundRegion = region
                        break
                    }
                } catch (regionError) {
                    continue
                }
            }

            if (!data) {
                await ctx.deleteMessage(processingMsg.message_id)
                return ctx.reply(
                    `❌ *Player Not Found*\n\n` +
                    `🔍 UID: ${uid}\n` +
                    `🌍 Checked Regions: ${regions.join(', ')}\n\n` +
                    `⚠️ Player may not exist or API is unavailable`,
                    { parse_mode: 'Markdown', reply_to_message_id: ctx.message.message_id }
                )
            }

            await ctx.deleteMessage(processingMsg.message_id)

            const formatDate = (timestamp) => {
                if (!timestamp || timestamp === "0") return 'N/A'
                const ts = parseInt(timestamp)
                if (isNaN(ts) || ts <= 0) return 'N/A'
                const date = new Date(ts * 1000)
                const day = date.getDate().toString().padStart(2, '0')
                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                const year = date.getFullYear()
                const hours = date.getHours().toString().padStart(2, '0')
                const minutes = date.getMinutes().toString().padStart(2, '0')
                const seconds = date.getSeconds().toString().padStart(2, '0')
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
            }

            const getRankName = (rankNum) => {
                const ranks = {
                    1: 'Bronze', 2: 'Silver', 3: 'Gold', 4: 'Platinum',
                    5: 'Diamond', 6: 'Heroic', 7: 'Grandmaster', 8: 'Master'
                }
                return ranks[rankNum] || `Rank ${rankNum}`
            }

            const basicInfo = data.basicInfo || {}
            const profileInfo = data.profileInfo || {}
            const clanBasicInfo = data.clanBasicInfo || {}
            const captainBasicInfo = data.captainBasicInfo || {}
            const petInfo = data.petInfo || {}
            const socialInfo = data.socialInfo || {}
            const diamondCostRes = data.diamondCostRes || {}
            const creditScoreInfo = data.creditScoreInfo || {}

            const message = [
                '┌ 👤 ACCOUNT BASIC INFO',
                `├─ Name: ${basicInfo.nickname || 'N/A'}`,
                `├─ UID: ${basicInfo.accountId || uid}`,
                `├─ Level: ${basicInfo.level || '0'} (Exp: ${(basicInfo.exp || 0).toLocaleString()})`,
                `├─ Region: ${foundRegion}`,
                `├─ Likes: ${(basicInfo.liked || 0).toLocaleString()}`,
                `├─ Honor Score: ${creditScoreInfo.creditScore || '100'}`,
                `├─ Celebrity Status: ${basicInfo.isCelebrity || 'False'}`,
                `├─ Evo Access Badge: ${basicInfo.badgeId || 'N/A'}`,
                `└─ Signature: ${socialInfo.signature || 'N/A'}`,
                '',
                '┌ 🎮 ACCOUNT ACTIVITY',
                `├─ Most Recent OB: ${basicInfo.releaseVersion || 'N/A'}`,
                `├─ Fire Pass: ${basicInfo.hasElitePass ? 'Active' : 'N/A'}`,
                `├─ Current BP Badges: ${basicInfo.badgeCnt || '0'}`,
                `├─ Account Type: ${basicInfo.accountType || '1'}`,
                `├─ BR Rank: ${getRankName(basicInfo.rank)} (${basicInfo.rankingPoints || '0'})`,
                `├─ CS Points: ${basicInfo.csRankingPoints || '0'}`,
                `├─ Created At: ${formatDate(basicInfo.createAt)}`,
                `└─ Last Login: ${formatDate(basicInfo.lastLoginAt)}`,
                '',
                '┌ 👕 ACCOUNT OVERVIEW',
                `├─ Avatar ID: ${profileInfo.avatarId || 'Failed to retrieve'}`,
                `├─ Banner ID: ${basicInfo.bannerId || 'Failed to retrieve'}`,
                `├─ Equipped Gun ID: ${basicInfo.weaponSkinShows && basicInfo.weaponSkinShows.length > 0 ? basicInfo.weaponSkinShows[0] : 'N/A'}`,
                `├─ Equipped Anime ID: ${profileInfo.avatarId || 'N/A'}`,
                `└─ Transform Animation ID: N/A`,
                '',
                '┌ 🐾 PET DETAILS',
                `├─ Equipped?: ${petInfo.isSelected ? 'Yes' : 'No'}`,
                `├─ Pet Name: ${petInfo.name || 'N/A'}`,
                `├─ Pet Type: ${petInfo.id || 'N/A'}`,
                `├─ Pet Exp: ${petInfo.exp || '0'}`,
                `├─ IsSelected: ${petInfo.isSelected ? 'True' : 'False'}`,
                `└─ Pet Level: ${petInfo.level || '0'}`,
                '',
                '┌ 🛡️ GUILD INFO',
                `├─ Guild Name: ${clanBasicInfo.clanName || 'No Guild'}`,
                `├─ Guild ID: ${clanBasicInfo.clanId || 'N/A'}`,
                `├─ Guild Level: ${clanBasicInfo.clanLevel || '0'}`,
                `├─ Guild Capacity: ${clanBasicInfo.capacity || '0'}`,
                `├─ Live Members: ${clanBasicInfo.memberNum || '0'}`,
                `└─ Leader Info:`,
                ` ├─ Leader Name: ${captainBasicInfo.nickname || basicInfo.nickname || 'N/A'}`,
                ` ├─ Leader UID: ${captainBasicInfo.accountId || basicInfo.accountId || 'N/A'}`,
                ` ├─ Leader Level: ${captainBasicInfo.level || basicInfo.level || '0'} (Exp: ${(captainBasicInfo.exp || basicInfo.exp || 0).toLocaleString()})`,
                ` ├─ Leader Title: ${basicInfo.title || 'N/A'}`,
                ` ├─ Leader Current BP Badges: ${captainBasicInfo.badgeCnt || basicInfo.badgeCnt || '0'}`,
                ` ├─ Leader BR Points: ${captainBasicInfo.rankingPoints || basicInfo.rankingPoints || '0'}`,
                ` └─ Leader CS Points: ${captainBasicInfo.csRankingPoints || basicInfo.csRankingPoints || '0'}`,
                '',
                '┌ 🛠️ EXTRA INFO',
                `├─ Release Version: ${basicInfo.releaseVersion || 'N/A'}`,
                `├─ Show BR Rank: ${basicInfo.showBrRank ? 'True' : 'False'}`,
                `├─ Show CS Rank: ${basicInfo.showCsRank ? 'True' : 'False'}`,
                `└─ External Icon Info:`,
                ` ├─ Status: ${basicInfo.externalIconInfo?.status || 'ExternalIconStatus_NOT_IN_USE'}`,
                ` └─ Show Type: ${basicInfo.externalIconInfo?.showType || 'ExternalIconShowType_FRIEND'}`,
                '',
                `📡 *Data Source: ${foundRegion} Region*`,
                `🕒 *Fetched: ${new Date().toLocaleTimeString()}*`,
                `🤖 *Bot: @${ctx.botInfo?.username || 'FreeFireInfoBot'}*`
            ].join('\n')

            await ctx.reply(message, {
                reply_to_message_id: ctx.message.message_id,
                disable_web_page_preview: true
            })

        } catch (error) {
            console.error('Error:', error.message)
            
            let errorMessage = `❌ *Failed to fetch data*\n\n`
            
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                errorMessage += `🔌 *Connection Error*\nAPI server is unreachable.\n\n`
                errorMessage += `🔧 *Please try again later*`
            } 
            else if (error.response?.status === 404) {
                errorMessage += `🔍 *Player Not Found*\n\n`
                errorMessage += `• UID: ${uid}\n`
                errorMessage += `• Player may not exist or is private`
            }
            else {
                errorMessage += `🔧 *Technical Error*\n`
                errorMessage += `• Error: ${error.message || 'Unknown'}`
            }

            await ctx.reply(errorMessage, {
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id
            })
        }
    }
}