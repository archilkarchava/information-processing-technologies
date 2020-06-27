# To add a new cell, type '# %%'
# To add a new markdown cell, type '# %% [markdown]'
# %%
from efficient_apriori import apriori

from common import display_md_str, read_csv_warehouse_data, top_itemsets

# %% [markdown]
# # Поиск шаблонов - 2
# Разработайте потоки работ для поиска частых наборов и устойчивых ассоциативных правил.<br />
# В качестве источника данных для поиска необходимо взять очищенные данные о поставках, полученные при выполнении задания ETL - 2.<br />
# Необходимо найти наборы деталей, которые часто доставляются в один и тот же день, и сформировать устойчивые правила, описывающие доставку деталей.
# Исследуйте изменения получаемых результатов в зависимости от различных пороговых значений поддержки и достоверности.
# Необходимо обеспечить выдачу названий товаров вместо их уникальных идентификаторов.

# %%
merged_data = read_csv_warehouse_data()
# %%
merged_data['WeekDay'] = merged_data['ShipDate'].apply(
    lambda date: date.weekday())


# %%
SP_by_weekday = [
    merged_data[merged_data['WeekDay'] == day] for day in range(7)]
SP_by_weekday[0]


# %%
SP_by_weekday[0][['ShipDate', 'PName']].groupby(
    'ShipDate').aggregate(lambda x: ','.join(x.values))['PName'].values

# %%
weekday_names = ['Monday', 'Tuesday', 'Wednesday',
                 'Thursday', 'Friday', 'Saturday', 'Sunday']
P_by_weekday = [[v.split(',') for v in SP_by_weekday[day][['ShipDate', 'PName']].groupby(
    'ShipDate').aggregate(lambda x: ','.join(x.values))['PName'].values] for day in range(len(weekday_names))]

# %%
for day in range(len(weekday_names)):
    display_md_str(f'# {weekday_names[day]}')
    sets, rules = apriori(
        P_by_weekday[day], min_support=0.25,  min_confidence=0.57, verbosity=1)
    display_md_str(top_itemsets(sets))
    print(rules)

# %%
merged_data['Day'] = merged_data['ShipDate'].apply(lambda date: date.day)

# %%
days = list(range(0, 32))

# %%
SP_by_day = [merged_data[merged_data['Day'] == day] for day in days]

# %%
P_by_day = [[
    v.split(',')
    for v in SP_by_day[day][['ShipDate', 'PName']].groupby('ShipDate').aggregate(lambda x: ','.join(x.values))['PName'].values]
    for day in days]

# %%
for day in days[1:]:
    display_md_str(f'# Day {day}')
    sets, rules = apriori(
        P_by_day[day], min_support=0.3,  min_confidence=0.7, verbosity=1)
    display_md_str(top_itemsets(sets))
    print(rules)
