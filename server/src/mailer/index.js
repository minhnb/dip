'use strict';

const config = require('../config/index');
const mandrill = require('mandrill-api/mandrill');
const mandrill_client = new mandrill.Mandrill(config.email.apiKey);

function sendEmail(recipients, subject, options, data) {
    return new Promise((resolve, reject) => {
        let name = config.email.name,
            from = config.email.address,
            message = {
                "subject": subject,
                "from_email": from,
                "from_name": name
            };

        recipients.map(email => email.type = 'to');
        message.to = recipients;
        if(data) message.global_merge_vars = data;
        options.message = message;
        mandrill_client.messages.sendTemplate(options, resolve, reject);
    });    
}

module.exports = {
    welcome: (recipients) => {
        let options = {
            template_name: 'welcome-to-dip',
            template_content: [{
                name: 'name',
                content: 'Welcome'
            }]
        },
        subject = 'Welcome to Dip!';
        return sendEmail(recipients, subject, options, null)
    }
};