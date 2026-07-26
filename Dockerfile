FROM node:20-alpine
WORKDIR /app
COPY nudge-backend/package*.json ./.
RUN npm install --production
COPY nudge-backend/ .
EXPOSE 5000
CMD ["npm", "start"]
