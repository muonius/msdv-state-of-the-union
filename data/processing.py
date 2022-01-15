# pip3 install -U gensim
# pip3 install --user -U nltk
# pip3 install -U pip setuptools wheel
# pip3 install -U spacy
# pip3 install stop-words
# python -m spacy download en_core_web_sm
# python -m nltk.downloader stopwords
#   WARNING: The script nltk is installed in '/Users/yangzhao/.local/bin' which is not on PATH.
#   Consider adding this directory to PATH or, if you prefer to suppress this warning, use --no-warn-script-location.

import csv
import sys
import os
import re
import pandas as pd
# import spacy
import numpy as np
import gensim
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
# nltk.download('punkt')
# nltk.download('wordnet')

# nlp = spacy.load('en')
lemmatizer = WordNetLemmatizer()
stop_words = stopwords.words('english')

with open('/Users/yangzhao/Desktop/SOTU/data/Obama_2016.txt') as c:
    content = c.read()

# Step 1: Text processing. Paragraph to list of sentences, to lists of words. Normalize, remove stop words and non alphanumeric values.

sentences = sent_tokenize(content)
# print(sentences[0])
sentences = [sentence.replace("\n", " ") for sentence in sentences]
# print(sentences[0])
sentences = [word.lower().split() for word in sentences]
# print(sentences[0])
sentences = [[re.sub(r'\W+', '', str(word))
              for word in sentence if word not in stop_words] for sentence in sentences]
# print(sentences[0])

# Make sure to bracket string to word

# Step 2: I attempted to lemmatize the text but realized without proper part-of-speech tagging, lemmatizion is not very helpful. Given the constraints of time, I decided to skip this step.

# print(trump_2018_content)

model = gensim.models.Word2Vec(
    sentences, vector_size=100, window=5, min_count=1, workers=2)

# voc_trump_2018 = list(model_trump_2018.wv.key_to_index.items())

# print(voc_trump_2018)

similar = model.wv.most_similar("happiness", topn=20)


print(similar)

fields = ["text", "score"]
values = [item[1] for item in similar]
# print(fields)
# print(values)

with open('/Users/yangzhao/Desktop/SOTU/output/biden2_2021_life.csv', 'w') as f:
    writer = csv.writer(f)
    writer.writerow(fields)
    writer.writerows(similar)


# path = "/Users/yangzhao/Desktop/SOTU/data/"
# dirs = os.listdir(path)
# president = "Adams"


# files = sorted(
#     [file for file in os.listdir(path) if president in file])

# print(files)

# # read each speech file

# speeches = []
# #
# with open(for file in files) as f:
#     speeches = f.readlines()

# print(speeches)
