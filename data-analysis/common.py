import os

import pandas as pd
from IPython.core.display import Image
from IPython.display import Markdown, display


def display_md_str(markdown_str):
    display(Markdown(markdown_str))


def display_img(s):
    display(Image(s))


def top_itemsets(itemset, top=5):
    res = ""
    for size, values in itemset.items():
        res += f'## Size {size}\n'
        values = sorted([(k, v) for k, v in values.items()],
                        key=lambda x: x[1], reverse=True)[:top]
        for (k, v) in values:
            res += f'- Basket({",".join(map(str, k))}): {v}\n'
    return res


def read_csv_warehouse_data():
    data_dir = './data/common/'
    file_names = ['S', 'P', 'SP']
    file_paths = {file_name: os.path.join(
        data_dir, f'{file_name}.csv') for file_name in file_names}
    S = pd.read_csv(file_paths['S'], converters={
                    'SName': str.strip, 'SCity': str.strip, 'Address': str.strip})
    P = pd.read_csv(file_paths['P'], converters={
                    'PName': str.strip, 'PCity': str.strip, 'Color': str.strip})
    SP = pd.read_csv(file_paths['SP'], parse_dates=[
        'ShipDate'], date_parser=lambda date_str: pd.datetime.strptime(date_str, '%Y-%m-%d'))
    merged_df: pd.DataFrame = SP.join(P.set_index('PID'), on='PID').join(
        S.set_index('SID'), on='SID')
    return merged_df
