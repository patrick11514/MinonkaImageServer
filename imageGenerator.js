const sharp = require('sharp')
const fs = require('fs')
const fetch = require('node-fetch')

module.exports = {
    generateImage: async function (templateName, variables) {
        if (!fs.existsSync(`./assets/templates/${templateName}.js`)) {
            return {
                error: `Template ${templateName} not found`,
            }
        }

        let templateFile = `${process.env.wf}/assets/templates/${templateName}.js`
        delete require.cache[require.resolve(templateFile)]

        let template = require(`./assets/templates/${templateName}.js`)

        template.init(variables)
        return await template.generate()
    },

    addSeries: async function (buffer, variable, x, y) {
        if (variable.promos.games) {
            let baseX = x
            let baseY = y

            for (let image of variable.promos.images) {
                buffer = await sharp(buffer)
                    .composite([
                        {
                            input: './assets/resized/' + image,
                            top: baseY,
                            left: baseX,
                        },
                    ])
                    .toBuffer()
                baseX += 26 + 5
            }
        }
        return buffer
    },

    getRankFile: async function (rank) {
        if (fs.existsSync(`./assets/resized/${rank.toLowerCase()}.png`)) {
            return `./assets/resized/${rank.toLowerCase()}.png`
        } else {
            return `./assets/resized/unranked.png`
        }
    },

    generateText: async function (text, textSize, width, height, color = '#fff', center = true, bold = true) {
        let centerText = ''
        if (center) {
            centerText = `x="50%" text-anchor="middle"`
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
            <text y="50%" ${centerText} class="text">${text}</text>
        </svg>`

        return await Buffer.from(txt)
    },

    fetchIcon: async function (iconId) {
        let file = `./icons_cache/${iconId}.png`
        let original = `./icons_cache/${iconId}_original.png`
        if (!fs.existsSync(file)) {
            let ver = fs.readFileSync('./assets/riotFiles/version', 'utf8')
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
}
