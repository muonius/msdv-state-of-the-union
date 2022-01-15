## Assignment 3 - Visualize Textual and Qualitative Data

### Summary
Create a visualization using the provided State of the Union text corpus. 

### Process
I chose to analyze the past 10 years State of the Union speeches. As a foreigner, I chose to de-politicize my analysis and focus on American values and people. I wanted to compare each speech to the Declaration of Independence, most particularly, how the keywords/American values of "American", "Equality", "Life", "Liberty" and "Happiness" were reflected in these speeches. 

### Text Processing
I pre-processed the text(normalized and tokenized) and then I used the [Gensim Word2Vec model](https://tedboy.github.io/nlps/generated/generated/gensim.models.Word2Vec.most_similar.html) to identify most similar words related to the abovementioned keywards in each speech.

For details of text preprocessing, see [here](https://github.com/muonius/msdv-dvia/blob/master/03-visualize-qualitative-data/data/processing.py).

### Visualization
I chose `d3.js` bubble charts for my visualization.

<img src="./Yang Zhao-03-visualize-text.png" width="800" alt="Visualization Screenshot">

### Outcome
I discovered that the model has a better outcome when it comes to Trump's speeches. They seem to be more relatable and Trump was the only one who mentioned "happiness". No wonder half of this country supported him.


### Limitations

This is a weekly assignment. Should time allow, I would have pre-processed the text with greater context such as lemmatizion. My `d3.js` chart is also a bit buggy that I will revisit and modify.
