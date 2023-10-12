#!/usr/bin/python3
# -*- coding: utf-8 -*-

import csv
import json
from pathlib import Path

from lib import *

with open(QUESTION_FILE, mode='r', encoding='utf8') as question_file:
    question = json.load(question_file)

post_data = get_post_data(limit=500)

print('Content-Type: application/json')
print(write_cookie('has_submitted', question[QUESTION_ID]))
print()

if post_data is None:
    print('{"exit": "answerTooLarge"}')

elif post_data['questionNumber'] != question[QUESTION_NUMBER]:
    print('{"exit": "wrongQuestion"}')

elif read_cookie('has_submitted') == question[QUESTION_ID]:
    print('{"exit": "alreadySubmitted"}')

elif Path(ANSWER_FILE).stat().st_size >= MAX_ANSWER_FILE_SIZE:
    print('{"exit": "fileTooLarge"}')

else:
    with open(ANSWER_FILE, mode='a', encoding='utf8') as answer_file:
        csv.writer(answer_file).writerow(post_data['answer'])
    print('{"exit": "success"}')
