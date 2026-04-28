FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund \
  || (status=$?; \
    echo "Dependency install failed. Dumping npm logs..."; \
    if [ -d /root/.npm/_logs ]; then \
      ls -lah /root/.npm/_logs || true; \
      for f in /root/.npm/_logs/*.log; do \
        [ -f "$f" ] || continue; \
        echo "==== $f ===="; \
        cat "$f"; \
      done; \
    else \
      echo "/root/.npm/_logs not found"; \
    fi; \
    exit $status)
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build \
  || (status=$?; \
    echo "Next build failed. Dumping npm logs..."; \
    if [ -d /root/.npm/_logs ]; then \
      ls -lah /root/.npm/_logs || true; \
      for f in /root/.npm/_logs/*.log; do \
        [ -f "$f" ] || continue; \
        echo "==== $f ===="; \
        cat "$f"; \
      done; \
    else \
      echo "/root/.npm/_logs not found"; \
    fi; \
    exit $status)

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
