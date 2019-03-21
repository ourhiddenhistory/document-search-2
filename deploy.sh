#!/bin/bash

# gulp build
# jekyll build --verbose --trace
rsync -acr --stats -e "ssh -p 2222 -o StrictHostKeyChecking=no" \
   --exclude .git \
   --delete-after \
   --exclude utils \
   --exclude docsData \
   . useful@50.87.146.99:/home2/useful/b.ourhiddenhistory.com/public/doc-search/
