# Implementation #1: Naive Search

After completing my intiial sanity check, I wanted to start with a naive approach to the problem. For this first attempt, I'm assumed that the data is historical and that I could analyze it after-the-fact. This approach allows me to easily find "normal" values and deduce the "abnormal" values based on statistical properties.

For this approach, I chose javascript (technically deno & typescript), since I'm most comfortable with it. I began by pre-processing the data by:
- removing unneccessary information
- filtering the unneccessary RAT values from the SAT values
- grouping the records by sensor (Device Name)
- sorting the occurrences by timestamp

Next, I calculated the mean and standard deviation for each sensor and performed a modification of a sliding window analysis to find consecutive outlier values.

## Assumptions
In addition to the "general" assumptions, I assumed the following:
- 3 standard deviations in either direction of the mean is considered "abnormal"
- I used the absolute distance between value and mean. This means that a value three deviations above followed by three standard deviations below would count as consecutive outliers. I did this because while such an abnormality might not neccessarily indicate a real issue with the air supply, it might show a faulty sensor.