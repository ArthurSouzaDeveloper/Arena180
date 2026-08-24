#!/bin/sh
set -e

# The uploads volume may already exist from a previous deploy that ran as
# root (before this container started dropping privileges), so its
# ownership can't be fixed once and for all in the image — re-assert it on
# every start, cheaply, then hand off to the unprivileged "node" user for
# the actual app process.
chown -R node:node /app/uploads

exec su-exec node "$@"
