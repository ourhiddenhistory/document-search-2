#!/bin/bash

GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
DOMAIN="b.ourhiddenhistory.org"

if [ "${GIT_BRANCH}" == "master" ]
then
  DOMAIN="b.ourhiddenhistory.org"
fi

ssh useful@50.87.146.99 -p 2222 -o StrictHostKeyChecking=no "mkdir -p /home2/useful/${DOMAIN}/html/doc-search"

rsync -acr --stats -e "ssh -p 2222 -o StrictHostKeyChecking=no" \
   ./_site/ useful@50.87.146.99:/home2/useful/${DOMAIN}/html/doc-search
