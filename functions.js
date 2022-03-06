const sharp = require('sharp')
const fs = require('fs')
const fetch = require('node-fetch')
const { resolve } = require('path')

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
                x: 102,
                y: 75,
            },
            'iron.png': {
                x: 102,
                y: 75,
            },
            'bronze.png': {
                x: 102,
                y: 75,
            },
            'silver.png': {
                x: 102,
                y: 75,
            },
            'gold.png': {
                x: 102,
                y: 75,
            },
            'platinum.png': {
                x: 102,
                y: 75,
            },
            'diamond.png': {
                x: 102,
                y: 75,
            },
            'master.png': {
                x: 102,
                y: 75,
            },
            'grandmaster.png': {
                x: 102,
                y: 75,
            },
            'challenger.png': {
                x: 102,
                y: 75,
            },
        }

        for (let file in files) {
            if (!fs.existsSync(`./assets/resized/${file}`)) {
                let buffer = await sharp(`./assets/${file}`).resize(files[file].x, files[file].y).toBuffer()
                fs.writeFileSync(`./assets/resized/${file}`, buffer)
                console.log(`Resized ${file} to ${files[file].x}x${files[file].y}`)
            }
        }
    },

    generateProfile: async function (params) {
        let name = params.name
        let region = params.region
        let level = params.level
        let icon = params.icon

        let solo = params.solo ? params.solo : null
        let flex = params.flex ? params.flex : null

        let temp_name = `./temp/${this.generateRandomString(15)}.png`

        let background = sharp('./assets/resized/layer.png')

        //add icon to background
        let iconFile = await this.fetchIcon(icon)

        background = await background.composite([{ input: iconFile, top: 52, left: 28 }]).toBuffer()

        //add background for level
        background = await sharp(background)
            .composite([{ input: './assets/resized/lol_level_layer.png', top: 328, left: 149 }])
            .toBuffer()

        //add ranks
        let rank_x = 747
        let rank_y = 120
        let rank_diff = 63 /**diff */ + 75 /**rank image size */

        if (solo) {
            background = await sharp(background)
                .composite([{ input: `./assets/resized/${solo.tier.toLowerCase()}.png`, top: rank_y, left: rank_x }])
                .toBuffer()
            rank_y += rank_diff
        }

        if (flex) {
            background = await sharp(background)
                .composite([{ input: `./assets/resized/${flex.tier.toLowerCase()}.png`, top: rank_y, left: rank_x }])
                .toBuffer()
            rank_y += rank_diff
        }

        let text = await this.generateText('Ahoj', 14, 55, 24)

        let buffer = await sharp(background)
            .composite([
                {
                    input: text,
                    top: 337,
                    left: 149,
                },
            ])
            .toBuffer()

        fs.writeFileSync(temp_name, buffer)
        console.log(`Generated profile for ${name}#${region} to ${temp_name}`)
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

    fetchIcon: async function (iconId) {
        let file = `./icons_cache/${iconId}.png`
        let original = `./icons_cache/${iconId}_original.png`
        if (!fs.existsSync(file)) {
            let ver = fs.readFileSync('./version', 'utf8')
            let url = `https://ddragon.leagueoflegends.com/cdn/${ver}/img/profileicon/${iconId}.png`
            let response = await fetch(url)

            let data = await response.buffer()
            console.log(`Downloaded icon ${iconId} to ${original}`)
            fs.writeFileSync(original, data)
            console.log(`Resizing icon ${iconId} to 300x300`)
            let buffer = await sharp(original).resize(300, 300).toBuffer()
            console.log(`Saving resized icon to ${file}`)
            fs.writeFileSync(file, buffer)
        }

        return file
    },

    generateText: async function (text, textSize, width, height, color = '#fff', center = true, bold = true) {
        let centerText = ''
        if (center) {
            centerText = `x="50%" y="50%" text-anchor="middle"`
        }
        let txt = `<svg width="${width}" height="${height}">
            <style>
                .text {
                    font-family: 'Roboto';
                    font-size: ${textSize}px;
                    fill: ${color};
                    font-weight: ${bold ? 'bold' : 'normal'};
                }
            </style>
            <text ${centerText} class="text">${text}</text>
        </svg>`

        return await Buffer.from(txt)
    },
}
