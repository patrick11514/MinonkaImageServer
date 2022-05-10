const sharp = require('sharp')
const fs = require('fs')
const _ = require('lodash')
const ig = require('./imageGenerator')
const logger = require('./logger')

module.exports = {
    //resize icons if not resized
    prepareResize: async function () {
        let files = {
            'layer.png': {
                x: 900,
                y: 400,
            },
            'lol_level_layer.png': {
                x: 55,
                y: 24,
            },
            'unranked.png': {
                x: 120,
                y: 88,
            },
            'iron.png': {
                x: 120,
                y: 88,
            },
            'bronze.png': {
                x: 120,
                y: 88,
            },
            'silver.png': {
                x: 120,
                y: 88,
            },
            'gold.png': {
                x: 120,
                y: 88,
            },
            'platinum.png': {
                x: 120,
                y: 88,
            },
            'diamond.png': {
                x: 120,
                y: 88,
            },
            'master.png': {
                x: 120,
                y: 88,
            },
            'grandmaster.png': {
                x: 120,
                y: 88,
            },
            'challenger.png': {
                x: 120,
                y: 88,
            },
            'seriesEmpty.png': {
                x: 26,
                y: 26,
            },
            'seriesWin.png': {
                x: 26,
                y: 26,
            },
            'seriesLose.png': {
                x: 26,
                y: 26,
            },
        }

        for (let file in files) {
            if (!fs.existsSync(`./assets/resized/${file}`)) {
                let buffer = await sharp(`./assets/${file}`).resize(files[file].x, files[file].y).toBuffer()
                fs.writeFileSync(`./assets/resized/${file}`, buffer)
                logger.log(`Resized ${file} to ${files[file].x}x${files[file].y}`)
            }
        }
    },

    generateProfile: async function (params) {
        let name = params.name
        let region = params.region
        let level = params.level
        let icon = params.icon

        if (fs.existsSync(`./temp/${name}@${region}.properties`)) {
            let data = fs.readFileSync(`./temp/${name}@${region}.properties`)
            data = JSON.parse(data)
            if (_.isEqual(data.params, params)) {
                if (fs.existsSync(data.filename)) {
                    logger.log(`Using generated image for ${name}@${region} in ${data.filename}`)
                    return data.filename
                }
            }
        }

        let solo = params.solo ? params.solo : null
        let flex = params.flex ? params.flex : null

        let temp_name = `./temp/${this.generateRandomString(15)}.png`

        let start = new Date()
        let buffer = await ig.generateImage('summoner', {
            name: name,
            region: region,
            level: level,
            icon: icon,
            solo: solo,
            flex: flex,
        })
        let diff = new Date() - start

        start = new Date()
        fs.writeFileSync(temp_name, buffer)
        fs.writeFileSync(`./temp/${name}@${region}.properties`, JSON.stringify({ filename: temp_name, params: params }))
        logger.log(`File written in ${new Date() - start}ms`)
        logger.log(`Generated profile for ${name}#${region} to ${temp_name} in ${diff}ms`)

        return temp_name
    },

    generateRandomString: function (length) {
        let result = ''
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let charactersLength = characters.length
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    },

    formatItem: function (item, fileName) {
        let description = item.description
        let to = item.into
        let from = item.from
        let name = item.name
        let price = item.gold.total
        let sell = item.gold.sell

        let emotes = require("./../assets/emojis.json")


        let stats = ["Health", "Base Health Regen", "Mana", "Base Mana Regen", "Armor", "Armor Penetration", "Magic Resist", "Magic Penetration", "Attack Damage", "Ability Power", "Move Speed", "Critical Strike Chance", "Ability Haste"]
        let emote = ["health", "healthregen", "mana", "manaregen", "armor", "armorpenetration", "magicresist", "magicpenetration", "attackdamage", "abilitypower", "movementspeed", "criticalchance", "cooldownreduction"]

        let statistics = []

        for (let i = 0; i < stats.length; i++) {
            let em = emotes[emote[i]]
            statistics[stats[i]] = em
        }

        //new lines and remove main text and replace li
        description = description
            .replaceAll("<br>", "\n")
            .replaceAll("<mainText>", "")
            .replaceAll("</mainText>", "")
            .replaceAll("<li>", "  <:li:973387468332220456> ")

        //replace words with emojis
        description = description.replace(/<stats>(.*?)<\/stats>/gs, (match, text, offset, string) => {
            string = string.replace(match, "")

            stats.forEach(stat => {
                string = string.replaceAll(` ${stat} `, ` ${stat} ${statistics[stat]}`)
            })
            return match + string + "<<==>>"
        })

        description = description.split("<<==>>")[0]

        //stats
        description = description.replace(/<stats>(.*?)<\/stats>/gs, (match, text) => {
            let split = text.split("\n")
            let statsText = []
            for (let spl of split) {
                let subText = ""

                let sp = spl.split(" ")
                sp = sp.slice(1, sp.length)
                let text = sp.join(" ")
                if (statistics[text]) {
                    subText += statistics[text] + " "
                }
                subText += spl
                statsText.push(subText)
            }

            return statsText.join("\n")
        })

        //bold

        let regexes = [
            /<attention>(.*?)<\/attention>/gs,
            /<ornnBonus>(.*?)<\/ornnBonus>/gs,
            /<active>(.*?)<\/active>/gs,
            /<passive>(.*?)<\/passive>/gs,
            /<rarityMythic>(.*?)<\/rarityMythic>/gs,
            /<rarityLegendary>(.*?)<\/rarityLegendary>/gs,
            /<keywordMajor>(.*?)<\/keywordMajor>/gs,
            /<keywordStealth>(.*?)<\/keywordStealth>/gs,
            /<scaleHealth>(.*?)<\/scaleHealth>/gs,
            /<scaleMana>(.*?)<\/scaleMana>/gs,
            /<scaleArmor>(.*?)<\/scaleArmor>/gs,
            /<scaleMR>(.*?)<\/scaleMR>/gs,
            /<scaleAP>(.*?)<\/scaleAP>/gs,
            /<scaleAD>(.*?)<\/scaleAD>/gs,
            /<physicalDamage>(.*?)<\/physicalDamage>/gs,
            /<magicalDamage>(.*?)<\/magicalDamage>/gs,
            /<shield>(.*?)<\/shield>/gs,

            /<status>(.*?)<\/status>/gs,
            /<trueDamage>(.*?)<\/trueDamage>/gs,
            /<scaleLevel>(.*?)<\/scaleLevel>/gs,
        ]

        let func = function (match, text) {
            return `**${text}**`
        }

        for (let regex of regexes) {
            description = description.replace(regex, func)
        }

        //italic

        regexes = [
            /<rules>(.*?)<\/rules>/gs,
        ]

        func = function (match, text) {
            return `*${text}*`
        }

        for (let regex of regexes) {
            description = description.replace(regex, func)
        }

        return {
            name: name,
            description: description,
            to: to,
            from: from,
            price: price,
            sell: sell,
            fileName: fileName
        }
    }

}
