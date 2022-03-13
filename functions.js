const sharp = require('sharp')
const fs = require('fs')
const fetch = require('node-fetch')
const ig = require('./imageGenerator')
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

        let buffer = await ig.generateImage('summoner', {
            name: name,
            region: region,
            level: level,
            icon: icon,
            solo: solo,
            flex: flex,
        })

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
}
