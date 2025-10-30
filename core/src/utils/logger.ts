import winston from 'winston';

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
};

winston.addColors(logLevels.colors);

// changes str to uppercase with colors
const toUpperWithColor = (str: string): string => {
  const codes: string[] = [];
  const strNoCode = str.replace(/\x1b\[[0-9;]*m/g, (match) => {
    codes.push(match);  
    return '';
  });
  return `${codes[0]}${strNoCode.toUpperCase()}${codes[1]}`;
};

// Create the logger instance
const logger = winston.createLogger({
  levels: logLevels.levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${toUpperWithColor(level)}] ${timestamp} ${message}`;
        })
      ),      
    }),
  ],
});

export default logger;
