# --- STAGE 1: BUILD ---
FROM node:18-alpine As build

WORKDIR /usr/src/app

# Copy package files first (to cache dependencies)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# --- STAGE 2: PRODUCTION RUN ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy only the built code and dependency list from Stage 1
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package*.json ./

# Install ONLY production dependencies (no devDependencies like Typescript/ESLint)
RUN npm install --only=production

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/main"]