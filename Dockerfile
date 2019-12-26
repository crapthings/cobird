FROM node:10.18-stretch

COPY package.json .
RUN npm install --verbose

COPY . .

EXPOSE 80 9999

CMD ["npm", "start"]
