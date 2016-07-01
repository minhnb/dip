'use strict';

const config = require('../config/index');
const mandrill = require('mandrill-api/mandrill');
const mandrill_client = new mandrill.Mandrill(config.email.apiKey);

var templatesInfo = {
    /**
     * @exports mailer.welcome
     */
    welcome: {
        name: 'welcome-to-dip',
        subject: 'Welcome to Dip!'
    },
    /**
     * @exports mailer.resetPassword
     */
    resetPassword: {
        name: 'password-reset',
        subject: 'Password Reset'
    }
};

/**
 * @module mailer
 */
Object.keys(templatesInfo).forEach(key => {
    let template = templatesInfo[key];

    exports[key] = (recipients, data, subject) => {
        let templateName = template.name;
        subject = subject || template.subject;

        // Allow to pass in 1 instance of recipient instead of array
        if (!Array.isArray(recipients)) {
            recipients = [recipients];
        }

        return sendEmail(recipients, subject, templateName, data);
    };
});

// module.exports = {
//     welcome: (recipients) => {
//         let subject = 'Welcome to Dip!';
//         return sendEmail(recipients, subject, 'welcome-to-dip', null)
//     }
// };

/**
 *
 * @param recipients
 * @param subject
 * @param templateName
 * @param data
 * @returns {Promise}
 *
 * Documentation: https://mandrillapp.com/api/docs/messages.nodejs.html#method=send-template
 */
function sendEmail(recipients, subject, templateName, data) {
    let options = {
        template_name: templateName,
        template_content: []
    };

    recipients.forEach(recipient => recipient.type = 'to');

    return new Promise((resolve, reject) => {
        let senderName = config.email.name,
            senderAddress = config.email.address,
            message = {
                to: recipients,
                subject: subject,
                from_email: senderAddress,
                from_name: senderName
            };

        if(data) {
            let mergeVars = [];
            Object.keys(data).forEach(key => {
                mergeVars.push({name: key, content: data[key]});
            });
            message.global_merge_vars = mergeVars;
        }
        /** Mandrill merge_vars format:
         * [{
         *      name: 'variable_name',
         *      content: 'variable_content'
         * }, {
         *      name: 'link',
         *      content: 'http://thedipapp.com/resetpassword/123456'
         * }]
         */



        options.message = message;
        mandrill_client.messages.sendTemplate(options, resolve, reject);
    });
}