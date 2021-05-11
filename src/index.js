const express = require('express')
const bodyParser = require('body-parser');
const axios = require('axios');
const nodemailer = require("nodemailer");

const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 3000
const errors = new Map();
const ok = new Map();
const transporter = nodemailer.createTransport({
    host: "thibaultsouquet-fr.mail.protection.outlook.com",
    port: 25,
    requireTLS: true,
    secure: false,
});

app.post('/', (req, res) => {
    parseBody(req.body)
    res.send('done');
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})

function parseBody(body) {
    console.log(new Date(), body._check_name, body._level);

    if(body._level === 'ok') {
        ok.set(body._check_id, body);
    }

    if(!errors.get(body._check_id) && ok.has(body._check_id) && body._level !== 'ok') {
        errors.set(body._check_id, body);
        ok.delete(body._check_id);
        notify(body);
    }
    if(errors.get(body._check_id) && body._level === 'ok') {
        errors.delete(body._check_id);
        ok.set(body._check_id, body);
        notify(body);
    }
}

function sendDiscordMessage(body) {
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
                    text: 'Notification by SOUQUET Thibault'
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

function sendMail(body) {
    transporter.sendMail({
        from: 'grafana@thibaultsouquet.fr',
        to: "contact@thibaultsouquet.fr",
        subject: `${body._check_name} - ${body._level}`,
        html: `<h1>${body._level}</h1><br /><p>${body._message}</p>`,
    }).catch()
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

function notify(body) {
    sendDiscordMessage(body);
    sendMail(body);
}
