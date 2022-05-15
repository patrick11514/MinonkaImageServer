const express = require('express')
const bodyParser = require('body-parser')
const package = require('./package.json')
const fetch = require('node-fetch')
const fs = require('fs')
const port = 3000

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.loading = true

const env = require('dotenv')
env.config({ path: '../.env' })
process.env.wf = __dirname

const g = require('./functions')

const logger = require('./logger.js')

    //fetch Riot Things..
    ; (async () => {
        //check for new version
        logger.log('Fetching current game version')
        let request = await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)
        let json = await request.json()
        let prevVersion = json[1]
        let currentVersion = json[0]
        logger.log(`Checking if files for version is uploaded`)

        //champions
        request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`)
        json = await request.json()
        if (json?.version != currentVersion) {
            logger.log('Falling back to previous version')
            currentVersion = prevVersion

            request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`)
            json = await request.json()
        }

        fs.writeFileSync('./assets/riotFiles/champions.json', JSON.stringify(json))

        //items
        request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/item.json`)
        json = await request.json()
        if (json?.version != currentVersion) {
            logger.log('Falling back to previous version')
            currentVersion = prevVersion

            request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/item.json`)
            json = await request.json()
        }

        fs.writeFileSync('./assets/riotFiles/items.json', JSON.stringify(json))

        //summoner spells
        request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/summoner.json`)
        json = await request.json()
        if (json?.version != currentVersion) {
            logger.log('Falling back to previous version')
            currentVersion = prevVersion

            request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/summoner.json`)
            json = await request.json()
        }

        fs.writeFileSync('./assets/riotFiles/summoner.json', JSON.stringify(json))

        //runes
        request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/runesReforged.json`)
        json = await request.json()

        fs.writeFileSync('./assets/riotFiles/runes.json', JSON.stringify(json))

        fs.writeFileSync('./assets/riotFiles/version', currentVersion)
        logger.log('Ok')

        //resize icons
        g.prepareResize()

        //clear cache
        logger.log('Removing old files from cache.')
        fs.readdirSync('./temp')
            .filter((name) => name.endsWith('.png'))
            .forEach((file) => {
                logger.log(`Removing ${file}`)
                fs.unlinkSync(`./temp/${file}`)
            })
        logger.log('Done.')

        //download champion images and save them to global scope
        json = require('./assets/riotFiles/champions.json')

        logger.log('Downloading champion images')
        app.champions = {}
        let champions = json.data
        let skins = []
        let keys = Object.keys(champions)
        let count = 0
        let count2 = 0
        for (let i = 0; i < keys.length; i++) {
            let champion = champions[keys[i]]
            let name = champion.id
            if (!fs.existsSync(`./assets/riotFiles/championsData/${name}.json`)) {
                logger.log(`Downloading data file for champion ${name}`)
                let request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion/${name}.json`)
                let json = await request.json()
                fs.writeFileSync(`./assets/riotFiles/championsData/${name}.json`, JSON.stringify(json))
                count++
            }

            let champInfo = JSON.parse(fs.readFileSync(`./assets/riotFiles/championsData/${name}.json`))
            let champSkins = champInfo.data[Object.keys(champInfo.data)[0]].skins

            for (let j = 0; j < champSkins.length; j++) {
                if (j == 0) continue
                let skin = champSkins[j]
                skins.push({
                    champ: name,
                    name: skin.name,
                    id: skin.num,
                })
            }

            app.champions[champion.key] = name
            let url = `http://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${name}.png`
            let file = `./assets/riotFiles/champions/${name}.png`
            if (fs.existsSync(file)) {
                continue
            }
            logger.log('Downloading ' + name)
            let request = await fetch(url)
            if (request.status == 200) {
                let data = await request.buffer()
                fs.writeFileSync(file, data)
                count++
            }
        }
        logger.log(`Downloaded ${count} images and downloaded ${count2} data files.`)

        app.skins = skins

        //download item images and save them to global scope
        json = require('./assets/riotFiles/items.json')

        logger.log('Downloading item images')
        let items = json.data
        keys = Object.keys(items)
        count = 0
        app.items = {}

        for (let i = 0; i < keys.length; i++) {
            let item = items[keys[i]]
            if (item.requiredChampion) {
                continue
            }

            let id = keys[i]
            let name = item.name
                .replaceAll("'", "")
                .replaceAll(" ", "")
                .replaceAll(".", "")
                .replaceAll("-", "")

            app.items[id] = g.formatItem(item, name, id)

            let url = `http://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${id}.png`
            let file = `./assets/riotFiles/items/${name}.png`
            if (fs.existsSync(file)) {
                continue
            }
            logger.log('Downloading ' + name)
            let request = await fetch(url)
            if (request.status == 200) {
                let data = await request.buffer()
                fs.writeFileSync(file, data)
                count++
            }

        }

        logger.log(`Downloaded ${count} images`)

        app.loading = false
    })()

app.get('/', (req, res) => {
    res.send(`Riot API v${package.version}`)
})

app.get('/status', (req, res) => {
    res.send({
        status: app.loading,
    })
})

app.post('/summonerProfile', async (req, res) => {
    let params = req.body

    if (app.loading) {
        return res.send({
            loading: true,
            error: 'Still loading.',
        })
    }

    if (!params.name || !params.level || !params.region || (!params.icon && params.icon != 0)) {
        return res.send({
            error: 'Missing parameters',
        })
    }

    let file = await g.generateProfile(params)
    if (file.constructor == [].constructor) {
        rs.send(file)
    } else {
        res.send({
            file: file,
        })
    }
})

app.post('/restart', async (req, res) => {
    let params = req.body
    if (params.token != process.env.restartToken) {
        return res.send({
            error: 'Invalid token',
        })
    }
    res.send({
        restarting: true,
    })
    logger.log('Restarting...')
    app.loading = true
    setTimeout(function () {
        process.exit(0)
    }, 200)
})

app.get('/champions', (req, res) => {
    res.send(app.champions)
})

app.get("/champion/:id(\d+)", (req, res) => {
    let id = req.params.id
    if (!app.champions[id]) {
        return res.send({
            error: 'Champion not found',
        })
    }

    let json = JSON.parse(fs.readFileSync(`./assets/riotFiles/championsData/${app.champions[id]}.json`))

    res.send(json.data[Object.keys(json.data)[0]])
})

app.get("/champion/:name", (req, res) => {
    let name = req.params.name.toLowerCase()

    if (name == "wukong")
        name = "monkeyking"

    let folder = "./assets/riotFiles/championsData"

    let files = fs.readdirSync(folder)

    let file = files.find((file) => file.toLowerCase().includes(name))

    if (!file) {
        return res.send({
            error: 'Champion not found',
        })
    }

    let json = JSON.parse(fs.readFileSync(`./assets/riotFiles/championsData/${file}`))

    res.send(json.data[Object.keys(json.data)[0]])
})

app.get("/skin/:name", (req, res) => {
    let name = req.params.name.toLowerCase()

    let skin = app.skins.find((data) => data.name.toLowerCase().includes(name))

    if (!skin) {
        return res.send({
            error: 'Skin not found',
        })
    }

    res.send(skin)

})

app.get('/items', (req, res) => {
    res.send(app.items)
})

app.listen(port, () => logger.log(`Riot API v${package.version} listening on port ${port}!`))
