#!/bin/bash

GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
DOMAIN="b-${GIT_BRANCH}.ourhiddenhistory.org"

ssh -p 2222 useful@50.87.146.99 "mkdir /home2/useful/${DOMAIN}/html/doc-search"

rsync -acr --stats -e "ssh -p 2222 -o StrictHostKeyChecking=no" \
   ./_site/ useful@50.87.146.99:/home2/useful/${DOMAIN}/html/doc-search
