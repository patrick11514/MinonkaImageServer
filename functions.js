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
