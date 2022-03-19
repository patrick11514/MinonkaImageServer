const sharp = require('sharp')
const fs = require('fs')
const fetch = require('node-fetch')

module.exports = {
    generateImage: async function (templateName, variables) {
        if (!fs.existsSync(`./assets/image_templates/${templateName}.json`)) {
            throw new Error(`Template ${templateName} does not exist`)
        }

        let templateFile = `${process.env.wf}/assets/image_templates/${templateName}.json`
        delete require.cache[require.resolve(templateFile)]

        let template = require(templateFile)

        let buffer = await sharp(template.sourceImage).toBuffer()

        for (let layer of template.layers) {
            if (layer.condition) {
                if (layer.condition.type == 'variable' && !variables[layer.condition.name]) continue
                if (layer.condition.type == 'invertedVariable' && variables[layer.condition.name]) continue
                if (layer.condition.type == 'multi') {
                    let allTrue = true
                    for (let condition of layer.condition.conditions) {
                        if (condition.type == 'variable' && !variables[condition.name]) {
                            allTrue = false
                        }
                        if (condition.type == 'invertedVariable' && variables[condition.name]) {
                            allTrue = false
                        }
                    }
                    if (!allTrue) continue
                }
            }

            if (layer.properties?.color.conditions) {
                layer.properties.color?.conditions.forEach((condition) => {
                    let ex = condition.name.includes('.') ? condition.name.split('.') : [condition.name]
                    let value = variables
                    ex.forEach((e) => {
                        value = !value[e] && value[e] != 0 ? null : value[e]
                    })

                    switch (condition.type) {
                        case 'variable': {
                            if (value) {
                                layer.properties.color = condition.color
                            }
                            break
                        }
                        case 'equals': {
                            if (value == condition.value) {
                                layer.properties.color = condition.color
                            }
                            break
                        }
                        case 'notEquals': {
                            if (value != condition.value) {
                                layer.properties.color = condition.color
                            }
                            break
                        }
                        case 'greaterThan': {
                            if (value >= condition.value) {
                                layer.properties.color = condition.color
                            }
                            break
                        }
                        case 'lowerThan': {
                            if (value < condition.value) {
                                layer.properties.color = condition.color
                            }
                            break
                        }
                    }
                })
            }

            switch (layer.type) {
                case 'image':
                    buffer = await this.addImage(buffer, layer, variables)
                    break
                case 'text':
                    buffer = await this.addText(buffer, layer, variables)
                    break
                case 'multi':
                    buffer = await this.addMultiText(buffer, layer, variables)
                    break
            }
        }

        return buffer
    },
    addImage: async function (buffer, layer, variables) {
        return await sharp(buffer)
            .composite([
                {
                    input:
                        layer.source.type == 'icon'
                            ? await this.fetchIcon(variables.icon)
                            : layer.source.type == 'rank'
                            ? await this.getRankFile(layer.source.tier, variables)
                            : layer.source.location,
                    top: layer.position.y,
                    left: layer.position.x,
                },
            ])
            .toBuffer()
    },

    addText: async function (buffer, layer, variables) {
        let text = ''
        if (layer.source.type == 'variable') {
            let ex = layer.source?.name.includes('.') ? layer.source?.name.split('.') : [layer.source.name]
            let value = variables
            ex.forEach((e) => {
                value = !value[e] && value[e] != 0 ? null : value[e]
            })
            text = value
        } else if (layer.source.type == 'text') {
            text = layer.source.text
        }

        return await sharp(buffer)
            .composite([
                {
                    input: await this.generateText(
                        text,
                        layer.properties.size,
                        layer.properties.width,
                        layer.properties.height,
                        layer.properties.color,
                        layer.properties.center,
                        layer.properties.bold
                    ),
                    top: layer.position.y,
                    left: layer.position.x,
                },
            ])
            .toBuffer()

        //let svg = await this.generateText(text, fontSize, width, height, color, center)
        //return await sharp(buffer)
        //    .composite([{ input: svg, top: y, left: x }])
        //    .toBuffer()
    },

    addMultiText: async function (buffer, layer, variables) {
        let text = ''
        for (let part of layer.parts) {
            let value = ''
            if (part.type == 'variable') {
                let ex = part.name.includes('.') ? part.name.split('.') : [part.name]
                value = variables
                for (let e of ex) {
                    value = !value[e] && value[e] != 0 ? null : value[e]
                }
            } else if (part.type == 'text') {
                value = part.text
            }
            if (part.lower) {
                value = value.toLowerCase()
            }
            if (part.upper) {
                value = value.toUpperCase()
            }
            if (part.first) {
                value = value.charAt(0).toUpperCase() + value.slice(1)
            }

            text += value
        }

        return await this.addText(
            buffer,
            {
                source: {
                    type: 'text',
                    text: text,
                },
                position: layer.position,
                properties: layer.properties,
                condition: layer?.condition,
            },
            variables
        )
    },

    getRankFile: async function (variable, variables) {
        let ex = variable.includes('.') ? variable.split('.') : [variable]
        let value = variables
        ex.forEach((e) => {
            value = !value[e] && value[e] != 0 ? null : value[e]
        })

        if (fs.existsSync(`./assets/resized/${value.toLowerCase()}.png`)) {
            return `./assets/resized/${value.toLowerCase()}.png`
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
}
