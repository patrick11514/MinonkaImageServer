const express = require('express')
const bodyParser = require('body-parser')
const package = require('./package.json')
const fetch = require('node-fetch')
const fs = require('fs')
const port = 3000

const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const env = require('dotenv')
env.config({ path: '../.env' })

const g = require('./functions')
//fetch Riot Things..
;(async () => {
    console.log('Fetching current game version')
    let request = await fetch(`https://ddragon.leagueoflegends.com/api/versions.json`)
    let json = await request.json()
    let prevVersion = json[1]
    let currentVersion = json[0]
    console.log('Checking if files for version is uploaded')
    request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`)
    json = await request.json()
    if (json?.version != currentVersion) {
        console.log('Falling back to previous version')
        currentVersion = prevVersion

        request = await fetch(`https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`)
        json = await request.json()
    }
    fs.writeFileSync('./champions.json', JSON.stringify(json))
    fs.writeFileSync('./version', currentVersion)
    console.log('Ok')

    //resize icons
    g.prepareResize()
})()

app.get('/', (req, res) => {
    res.send(`Riot API v${package.version}`)
})

app.post('/summonerProfile', async (req, res) => {
    let params = req.body
    if (!params.name || !params.level || !params.region || (!params.icon && params.icon != 0)) {
        return res.send({
            error: 'Missing parameters',
        })
    }

    let file = await g.generateProfile(params)
    res.send({
        file: file,
    })
})

app.listen(port, () => console.log(`Riot API v${package.version} listening on port ${port}!`))
