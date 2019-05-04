
# coding: utf-8

# # Data Formatting Script

# Importing the necessary packages

# In[1]:


import pandas as pd
import json


# Reading in the data

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


# ### Creating the Country Nodes Data
# 

# In[5]:


nodes_primary = set()
nodes_all = set()

country_all_sums = {}

for i, row in country_conf.iterrows():
    for num in (str(row['gwno_a']).split(',')) + (str(row['gwno_b']).split(',')):
        if num != 'nan':
            nodes_all.add(int(num))
            nodes_primary.add(int(num))
            if num in country_all_sums:
                country_all_sums[num] += 1
            else: 
                country_all_sums[num] = 1
    for num in (str(row['gwno_a_2nd']).split(',')) + (str(row['gwno_b_2nd']).split(',')):
        if num != 'nan':
            nodes_all.add(int(num))
            if num in country_all_sums:
                country_all_sums[num] += 1
            else: 
                country_all_sums[num] = 1


# ### Creating the Links Data

# In[6]:


def nums_to_list(nums):
    return [int(num) for num in (str(nums).split(',')) if num != 'nan']


def segmented_collocation_graph(primary, secondary, graph_all={}, graph_primary={}):
    for i in primary:
        if i not in graph_primary:
            graph_primary[i] = {}
            
        for j in primary:
            if i != j:
                if j in graph_primary[i]:
                    graph_primary[i][j] += 1
                else:
                    graph_primary[i][j] = 1
                    
    for i in primary + secondary:
        if i not in graph_all:
            graph_all[i] = {}
            
            for j in primary + secondary:
                if i != j:
                    if j in graph_all[i]:
                        graph_all[i][j] += 1
                    else:
                        graph_all[i][j] = 1
                        
                        
    return graph_all, graph_primary
    
    


# In[7]:


conflicts_all = {}
conflicts_primary = {}
alliances_all = {}
alliances_primary = {}

for i, row in country_conf.iterrows():
    side_a_primary = nums_to_list(row['gwno_a'])
    side_a_secondary = nums_to_list(row['gwno_a_2nd'])
    
    side_b_primary = nums_to_list(row['gwno_b'])
    side_b_secondary = nums_to_list(row['gwno_b_2nd'])
    
    alliances_all, alliances_primary = segmented_collocation_graph(side_a_primary, side_a_secondary, 
                                                                   alliances_all, alliances_primary)
    alliances_all, alliances_primary = segmented_collocation_graph(side_b_primary, side_b_secondary,
                                                                   alliances_all, alliances_primary)
    
    for num_a in side_a_primary:
        if num_a not in conflicts_primary:
            conflicts_primary[num_a] = {}
        for num_b in side_b_primary:
            if num_b in conflicts_primary[num_a]:
                conflicts_primary[num_a][num_b] += 1
            else:
                conflicts_primary[num_a][num_b] = 1
                
    for num_a in side_a_primary + side_a_secondary:
        if num_a not in conflicts_all:
            conflicts_all[num_a] = {}
        for num_b in side_b_primary + side_b_secondary:
            if num_b in conflicts_all[num_a]:
                conflicts_all[num_a][num_b] += 1
            else:
                conflicts_all[num_a][num_b] = 1
    
    
    


# #### Making adjacency matrix
# 

# In[8]:


conflicts_adj = {k: v for k, v in conflicts_all.items()}

for k, v in conflicts_all.items():
    for k2, v2 in v.items():
        if k2 not in conflicts_adj:
            conflicts_adj[k2] = {}
        if k not in conflicts_adj[k2]:
            conflicts_adj[k2][k] = v2


# In[9]:


alliances_adj = {k: v for k,v in alliances_all.items()}

for k,v in alliances_all.items():
    for k2, v2 in v.items():
        if k2 not in alliances_adj:
            alliances_adj[k2] = {}
        if k not in alliances_adj[k2]:
            alliances_adj[k2][k] = v2
            


# ### Formatting the Data as a JSON

# In[10]:


def region_converter(num):
    """
    converts gwno into region variable
    """
    if 200 <= num <= 395:
        region = "Europe"
    elif 630 <= num <= 698 and not num == 651:
        region = "Middle East"
    elif 700 <= num <= 990:
        region = "Asia"
    elif 400 <= num <= 626 and num == 651:
        region = "Africa"
    elif 2 <= num <= 165:
        region = "Americas"
    else:
        region = "Other"
    
    return region


# In[11]:


nodes_all_json = [{'id': i, 'region': region_converter(i)} for i in nodes_all]
nodes_primary_json = [{'id': i, 'region': region_converter(i)} for i in nodes_primary]
primary_conflicts_json = [{'source': a, 'target': b, 'value': w , 'type': 'enemy'} for a, v in conflicts_primary.items() for b, w in v.items() ]

primary_alliances_json = [{'source': a, 'target': b, 'value': w, 'type': 'ally'} for a, v in alliances_primary.items() for b, w in v.items()]

all_conflicts_json = [{'source': a, 'target': b, 'value': w , 'type': 'enemy'} for a, v in conflicts_all.items() for b, w in v.items() ]

all_alliances_json = [{'source': a, 'target': b, 'value': w, 'type': 'ally'} for a, v in alliances_all.items() for b, w in v.items()]


# In[12]:


ccodes = pd.read_csv('data/raw_data/COW_country_codes.csv')
ccodes.head()


# In[13]:


ccode_converter = {}
cname_converter = {}


for i, row in ccodes.iterrows():
    if row['CCode'] not in ccode_converter:
        ccode_converter[row['CCode']]={'abb': row['StateAbb'], 'name': row['StateNme']}

    if row['StateAbb'] not in cname_converter:
        cname_converter[row['StateAbb']] = {'name': row['StateNme'], 'code': row['CCode']}
ccode_converter[77] = 'Guinea'


# ## Writing data

# In[14]:


folder = 'data/formatted_data/'
with open(folder + 'nodes_all.json', 'w') as f1,    open(folder + 'nodes_primary.json', 'w') as f2,     open(folder + 'conflicts_all.json', 'w') as f3,    open(folder + 'alliances_all.json', 'w') as f4,    open(folder + 'ccode_converter.json', 'w') as f5,     open(folder + 'conflicts_primary.json', 'w') as f6,     open(folder + 'alliances_primary.json', 'w') as f7,     open(folder + 'conflict_adjacency_matrix.json', 'w') as f8,    open(folder + 'cname_convert.json', 'w') as f9,     open(folder + 'country_conflict_sums.json', 'w') as f10,     open(folder + 'alliance_adjacency_matrix.json', 'w') as f11:
        f1.write(json.dumps(nodes_all_json))
        f2.write(json.dumps(nodes_primary_json))
        f3.write(json.dumps(all_conflicts_json))
        f4.write(json.dumps(all_alliances_json))
        f5.write(json.dumps(ccode_converter))
        f6.write(json.dumps(primary_conflicts_json))
        f7.write(json.dumps(primary_alliances_json))
        f8.write(json.dumps(conflicts_adj))
        f9.write(json.dumps(cname_converter))
        f10.write(json.dumps(country_all_sums))
        f11.write(json.dumps(alliances_adj))


# ## Country-Year Mapping

# In[15]:


conf.columns


# In[16]:


conf['incompatibility'] = conf['incompatibility'].replace(
    {1: '1: Territory', 2: '2: Government', 3: '3 :Govt. and Territory'}
)
conf['intensity_level'] = conf['intensity_level'].replace({1: '1: Minor Conflict', 2: '2: War'})

conf['type_of_conflict'] = conf['type_of_conflict'].replace({
    1: '1: Extrasystemic (government and external non-state actor)',
    2: '2: Interstate (between two countries\' governments)',
    3: '3: Internal (between government and internal opposition)',
    4: '4: Internationalized internal conflict (internal conflict with external support)'
})



# In[17]:


conf.to_csv(folder + 'country_conflicts.csv')


# In[18]:


conf

