#!/usr/bin/python3
# -*- coding: utf-8 -*-

import csv
import json
from sys import stdout

from lib import *

print('Content-Type: application/json')
print()

with open(STATE_FILE, mode='r', encoding='utf8') as state_file:
    state = json.load(state_file)

question_number = state[QUESTION_NUMBER]
solution = state[SOLUTIONS][question_number]

answer_count = 0
all_correct_count = 0
result_by_answer = [0 for _ in solution]

with open(ANSWER_FILE, mode='r') as answers_file:
    for answer_row in csv.reader(answers_file):
        answer_count += 1
        all_correct = True
        for i, (answer, correct) in enumerate(zip(answer_row, solution)):
            if correct in ('y', 'n'):
                if answer == 'y':
                    result_by_answer[i] += 1
                if answer != correct:
                    all_correct = False
            else:
                if answer == correct:
                    result_by_answer[i] += 1
                else:
                    all_correct = False
        if all_correct:
            all_correct_count += 1


json.dump(
    {
        'answer_count': answer_count,
        'correct_count': all_correct_count,
        'solution': solution,
        'result_by_answer': result_by_answer
    },
    stdout
)
