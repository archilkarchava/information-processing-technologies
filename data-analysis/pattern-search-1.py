# To add a new cell, type '# %%'
# To add a new markdown cell, type '# %% [markdown]'
# %%
import os

from efficient_apriori import apriori
from IPython.core.display import Markdown, display

from common import display_md_str, top_itemsets

# %% [markdown]
# # Поиск шаблонов - 1
# Разработайте потоки работ для поиска частых наборов и устойчивых ассоциативных правил.<br />
# Набор данных содержит анонимные сведения о продажах реального магазина.<br />
# Каждая строка представляет собой данные одной корзины и содержит идентификаторы купленных товаров через запятую. Файл содержит 88162 строк, 16469 уникальных идентификаторов товаров, максимальное количество товаров в корзине равно 30.<br />
# Необходимо найти наборы товаров, которые часто покупаются совместно, и сформировать устойчивые правила продажи товаров. Исследуйте изменения получаемых результатов в зависимости от различных пороговых значений поддержки и достоверности.

# %%
data_folder = './data/pattern-search'
baskets_file = os.path.join(data_folder, 'baskets.csv')
with open(baskets_file, 'r') as f:
    lines = f.readlines()

# %%
norm_line = list(filter(lambda line: bool(
    line), map(lambda line: line.strip(), lines)))

# %%
baskets = list(map(lambda line: list(
    map(int, line.strip().split(','))), norm_line))

# %% [markdown]
# # Sample 1
# Min support: 0.01<br />
# Min confidence: 0.5

# %%
itemsets_1_50, rules_1_50 = apriori(
    baskets, min_support=0.01,  min_confidence=0.5, verbosity=1)

# %%
display_md_str(top_itemsets(itemsets_1_50))

# %%
rules_1_50

# %% [markdown]
# # Sample 2
# Min support: 0.01<br />
# Min confidence: 0.8

# %%
itemsets_1_80, rules_1_80 = apriori(
    baskets, min_support=0.01,  min_confidence=0.8, verbosity=1)

# %%
display_md_str(top_itemsets(itemsets_1_80))

# %%
rules_1_80

# %% [markdown]
# # Sample 3
# Min support: 0.3<br />
# Min confidence: 0.5

# %%
itemsets_20_80, rules_20_80 = apriori(
    baskets, min_support=0.3,  min_confidence=0.5, verbosity=1)

# %%
display_md_str(top_itemsets(itemsets_20_80))

# %%
rules_20_80
