const express = require('express')
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express()

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

const port = 3000
const errors = new Map();
const ok = new Map();

app.post('/', (req, res) => {
    parseBody(req.body)
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function parseBody(body) {
    console.log(new Date(), body._check_name, body._level);

    if(body._level === 'ok') {
        ok.set(body._check_id, body);
    }

    if(!errors.get(body._check_id) && ok.has(body._check_id) && body._level !== 'ok') {
        errors.set(body._check_id, body);
        ok.delete(body._check_id);
        sendBotMessage(body);
    }
    if(errors.get(body._check_id) && body._level === 'ok') {
        errors.delete(body._check_id);
        ok.set(body._check_id, body);
        sendBotMessage(body);
    }
}

function sendBotMessage(body) {
    const config = {
        method: 'post',
        url: `https://discord.com/api/webhooks/${process.env.WEBHOOK_ID}/${process.env.WEBHOOK_SECRET}`,
        headers: {
            'Content-Type': 'application/json',
        },
        data : {
            username: "InfluxDB",
            avatar_url: "https://influxdata.github.io/branding/img/downloads/influxdata-logo--symbol--pool-alpha.png",
            embeds: [{
                color: getColorFromLevel(body._level),
                title: body._check_name,
                description: body._message,
                footer:{
                    icon_url: 'https://influxdata.github.io/branding/img/downloads/influxdata-logo--symbol--pool-alpha.png',
                    text: 'InfluxDB 2'
                },
            }],
        }
    };
    try {
        axios(config).catch();
    } catch (e) {
        console.error(e);
    }
}

function getColorFromLevel(code) {
    switch (code) {
        case 'warn':
            return 16765525;
        case 'info':
            return 41983;
        case 'ok':
            return 40799;
        case 'crit':
            return 14437976;
        default:
            return 10067371;
    }
}
