
# coding: utf-8

# # Data Formatting Script

# Importing the necessary packages

# In[1]:


import numpy as np
import pandas as pd
import json


# In[2]:


conf = pd.read_csv("data/raw_data/ucdp-prio-acd-181.csv")  # reading in conflict dyads data
conf.head()  # examining its structure


# In[3]:


# Function to convert numeric values and return 0 if they are not numeric, 
# this will allow entries without countries as the co-belligerent to be filtered out
def integerize(x):
    try:
        return int(x)
    except ValueError:
        return 0
    
# Filter the data to just that have countries on both sides
country_conf = conf[conf.gwno_b.apply(integerize) > 0]
print(country_conf.shape) # shape of the data frame
print(country_conf.columns) # names of the columns
country_conf.head()


# In[4]:


print(country_conf['gwno_a']) # examine the structure when there are multiple gwno's


# In[5]:


nodes = set()  # set to store the unique countries in the data
country_name_gwno_mapping = {} # dictionary to store the combinations of gwno's and country names


for i, row in country_conf.iterrows(): # for every row in the data
    for num, name in zip(row['gwno_a'].split(','), row['side_a'].split(',')): # grab the gwno and country names
        if num not in country_name_gwno_mapping:
            country_name_gwno_mapping[num]= name.strip()
        nodes.add(num.strip())
        
    for num, name in zip(row['gwno_b'].split(','), row['side_b'].split(',')): # grab the gwno and country names
        if num not in country_name_gwno_mapping:
            country_name_gwno_mapping[num]= name.strip()
        nodes.add(num.strip())


# In[6]:


print(nodes)
# print(country_name_gwno_mapping)
for k, v in country_name_gwno_mapping.items():
    print(k, v)


# In[7]:


conflicts = {} # dictionary to hold the combinations of countries
alliances = {}

for i, row in country_conf.iterrows():
    # List of all of the countries on side a
    side_a = [num.strip() for num in row['gwno_a'].split(',')]
    
    # List of all the countries on side b
    side_b = [num.strip() for num in row['gwno_b'].split(',')]
    
    for i in side_a:
        if i not in alliances:
            alliances[i] = {}
        for j in side_a:
            if i != j:
                if j in alliances[i]:
                    alliances[i][j] += 1
                else:
                    alliances[i][j] = 1
                    
    for i in side_b:
        if i not in alliances:
            alliances[i] = {}
        for j in side_a:
            if i != j:
                if j in alliances[i]:
                    alliances[i][j] += 1
                else:
                    alliances[i][j] = 1
    
    for num_a in side_a:
        if num_a not in conflicts:
            conflicts[num_a] = {}
        for num_b in side_b:
            if num_b in conflicts[num_a]:
                conflicts[num_a][num_b] += 1
#                 links[num_a][num_b][1].append(row['start_date'])
            else:
                conflicts[num_a][num_b] = 1
#                 links[num_a][num_b] = [1, [row['start_date']]]
                
    for num_b in side_b:
        if num_b not in conflicts:
            conflicts[num_b] = {}
        for num_a in side_a:
            if num_a in conflicts[num_b]:
                conflicts[num_b][num_a] += 1
            else:
                conflicts[num_b][num_a] = 1
    


# In[8]:


print(conflicts)
print(alliances)


# In[9]:


nodes_json = [{'id': i}for i in nodes]
print(nodes_json)
conflicts_json = [{'start': a, 'end': b, 'weight': w } for a, v in conflicts.items() for b, w in v.items() ]
print(conflicts_json)
alliances_json = [{'start': a, 'end': b, 'weight': w} for a, v in alliances.items() for b, w in v.items()]
print(alliances_json)


# In[10]:


ccodes = pd.read_csv('data/raw_data/COW_country_codes.csv')
ccodes.head()


# In[11]:


ccode_converter = {}

for i, row in ccodes.iterrows():
    if row['CCode'] not in ccode_converter:
        ccode_converter[row['CCode']]=row['StateAbb']
    
print(ccode_converter)


# In[12]:


folder = 'data/formatted_data/'
with open(folder + 'nodes.json', 'w') as f1,    open(folder + 'conflicts.json', 'w') as f2,    open(folder + 'alliances.json', 'w') as f3,    open(folder + 'ccode_converter', 'w') as f4:
        f1.write(json.dumps(nodes_json))
        f2.write(json.dumps(conflicts_json))
        f3.write(json.dumps(alliances_json))
        f4.write(json.dumps(ccode_converter))

