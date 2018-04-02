#!/bin/#!/usr/bin/env bash

gulp build
jekyll build
scp -r -P 2222 ~/Repos/doc-search-blog/_site/* useful@50.87.146.99:/home2/useful/ourhiddenhistory.com/public/doc-search/
