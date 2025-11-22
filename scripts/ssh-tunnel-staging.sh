#!/bin/bash
# SSH tunnel script for staging database
# This forwards local port 5433 to the remote postgres server on port 5432
# RUN WITH    ./scripts/ssh-tunnel-staging.sh

SSH_USER="quirky-penguin"
SSH_HOST="217.154.210.50"
LOCAL_PORT="5433"
REMOTE_HOST="localhost"
REMOTE_PORT="5432"

echo "Setting up SSH tunnel for staging database..."
echo "Local port: $LOCAL_PORT -> Remote: $REMOTE_HOST:$REMOTE_PORT"
echo "SSH connection: $SSH_USER@$SSH_HOST"
echo ""
echo "To stop the tunnel, press Ctrl+C"
echo ""

# Create the SSH tunnel
# -N: Don't execute remote commands
# -L: Local port forwarding
# -f: Background process
# -o ExitOnForwardFailure=yes: Exit if port forwarding fails
ssh -N -L ${LOCAL_PORT}:${REMOTE_HOST}:${REMOTE_PORT} \
    -o ExitOnForwardFailure=yes \
    ${SSH_USER}@${SSH_HOST}
