FROM mhart/alpine-node:11 AS build
WORKDIR /srv
ADD package.json .
RUN npm install
ADD . .

FROM mhart/alpine-node:base-11
COPY --from=build /srv .
EXPOSE 3000
CMD ["node", "app.js"]