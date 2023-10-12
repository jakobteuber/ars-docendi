#!/usr/bin/python3
# -*- coding: utf-8 -*-


import json
from sys import stdout

from lib import *

print('Content-Type: application/json')
print()

try:
    question_file = open(QUESTION_FILE, mode='r', encoding='utf8')
    question = json.load(question_file)

    can_submit = read_cookie('has_submitted') != question[QUESTION_ID]

    json.dump({
        'number': question[QUESTION_NUMBER],
        'question': question[QUESTION_TEXT],
        'canSubmit': can_submit
    }, stdout)

except FileNotFoundError as e:
    print('{"error": "no active question"}')
finally:
    question_file.close()
