#!/usr/bin/python3
# -*- coding: utf-8 -*-

import json
from pathlib import Path
from re import findall, sub
from uuid import uuid4

from lib import *


def stop_current_question():
    def remove_if_exists(path):
        try:
            Path(path).unlink()
        except FileNotFoundError as e:
            pass

    remove_if_exists(STATE_FILE)
    remove_if_exists(QUESTION_FILE)
    remove_if_exists(ANSWER_FILE)


def extract_solution(text):
    replacements = (
        ('@\\(([yn])\\)', '@()'),
        ('@\\[([yn])\\]', '@[]'),
        ('@\\{int:([0-9]+)\\}', '@{int}'),
        ('@\\{float:([0-9]+(?:\\.[0-9]+)?)\\}', '@{float}'),
        ('@\\{text:([^\n\\}]+)\\}', '@{text}')
    )
    solutions = []

    for pattern, replacement in replacements:
        solutions += findall(pattern, text)
        text = sub(pattern, replacement, text)

    return text, solutions


def write_question_file(state):
    with open(QUESTION_FILE, mode='w', encoding='utf8') as question_file:
        question_number = state[QUESTION_NUMBER]
        json.dump(
            {
                QUESTION_NUMBER: question_number,
                QUESTION_ID: state[QUESTION_SET_ID] + '-' + str(question_number),
                QUESTION_TEXT: state[QUESTIONS][question_number]
            },
            question_file
        )


def setup_question_set(filename):
    if '..' in filename:
        return

    stop_current_question()

    with open(CONTENT_DIR + filename, mode='r', encoding='utf8') as f:
        content = [extract_solution(question)
                   for question in f.read().split(QUESTION_SEP)]

    state = {
        QUESTION_SET_ID: str(uuid4()),
        QUESTION_NUMBER: 0,
        NUMBER_OF_QUESTIONS: len(content),
        QUESTIONS: [questionText for questionText, _ in content],
        SOLUTIONS: [solution for _, solution in content]
    }

    with open(STATE_FILE, mode='w', encoding='utf8') as state_file:
        json.dump(state, state_file)

    write_question_file(state)
    Path(ANSWER_FILE).touch()


def next_question():
    with open(STATE_FILE, mode='r', encoding='utf8') as state_file:
        state = json.load(state_file)
        state[QUESTION_NUMBER] += 1
    if state[QUESTION_NUMBER] >= state[NUMBER_OF_QUESTIONS]:
        stop_current_question()
    else:
        with open(STATE_FILE, mode='w', encoding='utf8') as state_file:
            json.dump(state, state_file)

        write_question_file(state)

        with open(ANSWER_FILE, mode='w', encoding='utf8') as _:
            pass  # deletes the contents of this file


print('Content-Type: application/json')
print()

post_data = get_post_data(limit=500)
action = post_data['action']

if action == 'next':
    next_question()
elif action == 'setup':
    setup_question_set(post_data['filename'])

elif action == 'reset':
    stop_current_question()

print('{"exit": "success"}')
