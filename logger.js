import * as fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const SOURCE_FOLDER = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({path: `${SOURCE_FOLDER}/.env`});

export const logInfo = (message) => {
    const logEntry = `${message}\n`;
    const fileName= process.env.LOG_PATH || (SOURCE_FOLDER + "/radius_mcp_app.log")

    fs.appendFile(fileName, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
    if (process.env.NODE_ENV !== 'development') {
        console.log(message);
    }
};
