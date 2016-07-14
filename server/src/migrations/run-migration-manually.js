'use strict';

const args = process.argv.slice(2);
const procName = process.argv[1];
const usage = `Usage: node ${procName} up|down migrationFileName.js`;

if (args.length !== 2 || ['up', 'down'].indexOf(args[0]) == -1) {
    console.error('Invalid arguments');
    console.error(usage);
    process.exit(1);
}

const fileName = args[1];
const migrationModule = require('./' + fileName);

if (!migrationModule.up || !migrationModule.down) {
    console.error('Bad migration file. Couldn\'t up and down methods.');
    process.exit(2);
}

const main = migrationModule[args[0]];
const callback = function(type) {
    return (error) => {
        if (!error) {
            console.log(`migration ${type} ${fileName} completed.`);
            process.exit();
        } else {
            console.error(error);
            process.exit(3);
        }
    }
};

main(callback(args[0]));