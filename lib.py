# -*- coding: utf-8 -*-

import json
import sys
from os import environ
from http.cookies import SimpleCookie
from codecs import getwriter

VERSION = '0.1'
BASE_URL = 'https://home.in.tum.de/~teuj/ars/'
QUESTION_SEP = '@@@'

CONTENT_DIR = 'content/'
STATE_FILE = 'state/state.json'
ANSWER_FILE = 'state/answer.csv'
QUESTION_FILE = 'state/question.json'

QUESTION_NUMBER = 'question_number'
QUESTION_SET_ID = 'question_set_id'
QUESTION_ID = 'question_id'
QUESTION_TEXT = 'question_text'
NUMBER_OF_QUESTIONS = 'number_of_questions'
QUESTIONS = 'questions'
SOLUTIONS = 'solutions'

"""
The maximal size in bytes for the answer file. 
Any answers beyond this limit will be rejected
"""
MAX_ANSWER_FILE_SIZE = 524288000  # 500 MB


def utf8_print_setup():
    sys.stdout = getwriter("utf-8")(sys.stdout.detach())


def get_post_data(limit=500):
    content_length = environ.get('CONTENT_LENGTH')
    post_load = sys.stdin.read(int(content_length))

    if len(post_load) > limit:
        return None
    else:
        return json.loads(post_load)


def write_cookie(key, value):
    c = SimpleCookie()
    c[key] = value
    return c.output()


def read_cookie(key):
    cookies = environ.get('HTTP_COOKIE')
    if cookies is None:
        return None

    for pair in cookies.split(';'):
        name, value = pair.strip().split('=', 1)
        if name == key:
            return value

    return None
