FROM node:24-alpine
COPY . /usr/app
WORKDIR /usr/app
RUN npm -g install tsm
CMD ["tsm", "bowtie.ts"]
