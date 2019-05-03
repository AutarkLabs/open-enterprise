# Use an official node runtime image as a parent image
FROM node:10-alpine

# These deps are mostly for ganache and deprecated ipfs-api
# --no-cache: download package index on-the-fly, no need to cleanup afterwards
# --virtual: bundle packages, remove whole bundle at once, when done
RUN apk --no-cache --virtual .gyp add \
    g++ \ 
    gcc \
    git \
    go \
    libc6-compat \
    lscpu \
    make \
    python \
    rsync

# Set the container working directory to /planning-suite
WORKDIR /planning-suite

# Copy dependency files to workdir
COPY package.json lerna.json ./

# copy each package deps definitions
COPY apps/address-book/package.json ./apps/address-book/
COPY apps/allocations/package.json ./apps/allocations/
COPY apps/dot-voting/package.json ./apps/dot-voting/
COPY apps/projects/package.json ./apps/projects/
COPY apps/rewards/package.json ./apps/rewards/
COPY apps/shared/test-helpers/package.json ./apps/shared/test-helpers/
COPY apps/planning-suite-kit/package.json ./apps/planning-suite-kit/
COPY shared/ui/package.json ./shared/ui/

RUN npm i
RUN npm run bootstrap

COPY . .

CMD ["node_modules/.bin/lerna","run","dev", "--parallel", "--scope=@tps/apps-*"]

EXPOSE 1111 2222 3333 4444 5555