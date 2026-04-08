FROM node:24-alpine
COPY . /usr/app
WORKDIR /usr/app
RUN npm install --omit=dev
RUN npm -g install tsm
CMD ["tsm", "bowtie.ts"]
