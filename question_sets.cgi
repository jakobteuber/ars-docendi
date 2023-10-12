#!/usr/bin/python3
# -*- coding: utf-8 -*-

from os import walk, path
from json import dump
from sys import stdout

print('Content-Type: application/json')
print()

all_files = []

for (root, dirs, files) in walk('content/', topdown=True):
    all_files += [path.join(root, f) for f in files]

dump({'questionSets': [f[8:] for f in sorted(all_files)]}, stdout)
