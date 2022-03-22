const sharp = require('sharp')
const ig = require('./../../imageGenerator.js')

String.prototype.firstUpper = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

module.exports = {
    variables: null,
    init: function (variables) {
        this.variables = variables
    },
    generate: async function () {
        //source image
        let buffer = await sharp('./assets/resized/layer.png').toBuffer()

        //summoner profile
        buffer = await this.composite(buffer, await ig.fetchIcon(this.variables.icon), 28, 52)

        //level
        buffer = await this.composite(buffer, './assets/resized/lol_level_layer.png', 149, 328)
        buffer = await this.composite(buffer, await this.addText(this.variables.level, 14, 55, '#FFF'), 149, 337)

        //summoner name
        buffer = await this.composite(
            buffer,
            await this.addText(`${this.variables.name} (${this.variables.region})`, 32, 348, '#FFF', false),
            348,
            54
        )

        //queues
        let x = 348,
            y = 104
        if (this.variables.solo) {
            ;[buffer, y] = await this.addRanked(buffer, 'Solo/Duo:', this.variables.solo, x, y)
        }

        if (this.variables.flex) {
            ;[buffer, y] = await this.addRanked(buffer, 'Flex:', this.variables.flex, x, y)
        }

        if (!this.variables.solo && !this.variables.flex) {
            buffer = await this.composite(
                buffer,
                await this.addText('No ranked data found', 28, 348, '#ff0000', false),
                x,
                y
            )
        }
        return buffer
    },

    addText: async function (text, size, width, color, centered = true, bold = true) {
        return await ig.generateText(text, size, width, size * 1.8, color, centered, bold)
    },

    composite: async function (buffer, source, x, y) {
        return await sharp(buffer)
            .composite([
                {
                    input: source,
                    top: y,
                    left: x,
                },
            ])
            .toBuffer()
    },

    addRanked: async function (buffer, text, ranked, x, y) {
        buffer = await this.composite(buffer, await this.addText(text, 28, 348, '#FFF', false), x, y)
        buffer = await ig.addSeries(buffer, ranked, text == 'Solo/Duo:' ? 480 : 415, y)
        y += 24
        buffer = await this.composite(
            buffer,
            await this.addText(
                `${ranked.tier.toLowerCase().firstUpper()} ${ranked.rank}`,
                28,
                348,
                this.getRankColor(ranked.tier),
                false
            ),
            x,
            y
        )

        buffer = await this.composite(buffer, await this.addText(`${ranked.lp}LP`, 28, 348, '#FFF', false), 528, y)

        buffer = await this.composite(buffer, await ig.getRankFile(ranked.tier), 700, y - 10)

        y += 24
        buffer = await this.composite(
            buffer,
            await this.addText(`${ranked.wr}% Win rate`, 28, 348, ranked.wr >= 50 ? '#1fed18' : '#ff0000', false),
            x,
            y
        )
        y += 24
        buffer = await this.composite(buffer, await this.addText(`${ranked.wins}W`, 28, 348, '#1fed18', false), x, y)
        buffer = await this.composite(buffer, await this.addText(`${ranked.loses}L`, 28, 348, '#ff0000', false), 478, y)
        y += 36

        return [buffer, y]
    },

    getRankColor: function (rank) {
        switch (rank) {
            case 'UNRANKED': {
                return '#99978b'
                break
            }
            case 'IRON': {
                return '#544c3d'
                break
            }
            case 'BRONZE': {
                return '#966502'
                break
            }
            case 'SILVER': {
                return '#99978b'
                break
            }
            case 'GOLD': {
                return '#e6c41c'
                break
            }
            case 'PLATINUM': {
                return '#49ebaa'
                break
            }
            case 'DIAMOND': {
                return '#5149eb'
                break
            }
            case 'MASTER': {
                return '#8117b3'
                break
            }
            case 'GRANDMASTER': {
                return '#9e0606'
                break
            }
            case 'CHALLENGER': {
                return '#e5f051'
                break
            }
        }
    },
}
