FROM node:10.18-stretch

COPY package.json .
RUN npm install --verbose

COPY . .

CMD ["npm", "start"]
