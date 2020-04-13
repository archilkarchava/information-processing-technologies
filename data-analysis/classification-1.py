# To add a new cell, type '# %%'
# To add a new markdown cell, type '# %% [markdown]'
# %%
import os
import pathlib

import pandas as pd
import pydot
from IPython.core.display import display_markdown
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeClassifier, export_graphviz

from common import display_img

# %% [markdown]
# # Классификация - 1
# Разработайте поток работ для классификации данных на основе дерева решений.<br />
# Набор данных содержит анонимные данные об оценках школьников за письменную контрольную работу в реальной школе. Каждая строка содержит перечисленные через запятую следующие данные:
# - пол ученика (PUPIL_SEX);
# - класс ученика (PUPIL_CLASS);
# - процент заданий контрольной работы, оцененных учителем как правильно выполненные (TEACHER_RIGHT);
# - количество символов "птичка", проставленных учителем (TEACHER_CHK);
# - количество символов вопроса, проставленных учителем (TEACHER_QUEST);
# - количество исправлений, сделанных учителем (TEACHER_CORR);
# - количество исправлений, сделанных учеником (PUPIL_CORR);
# - количество фактов использования учеником штриха-замазки (PUPIL_STRIP);
# - итоговая оценка, выставленная учителем (FINALMARK).
#
#
# Файл содержит 72 строки.<br />
# Необходимо построить дерево решений, которое покажет правила классификации контрольных работ (выставление итоговой оценки). <br />
# Для экспорта графа в png используется внешняя зависимость graphviz

# %%
data_dir = './data/classification'
marks_file = os.path.join(data_dir, 'marks.csv')
marks_data: pd.DataFrame = pd.read_csv(marks_file)

# %%
marks_data

# %%
marks_train: pd.DataFrame = marks_data.drop(['FINALMARK'], axis=1)
marks_test = marks_data['FINALMARK']

# %%
cat_features_list = ['PUPIL_SEX', 'PUPIL_CLASS']

# %%
num_features: pd.DataFrame = marks_train.drop(cat_features_list, axis=1)
num_features

# %% [markdown]
# ## Encode categorical features as a one-hot numeric array.

# %%
marks_encoder = OneHotEncoder(handle_unknown='ignore')
cat_features = marks_encoder.fit_transform(
    marks_train[cat_features_list]).toarray()

# %%
one_hot_data = pd.DataFrame({name: features for name, features in zip(
    marks_encoder.get_feature_names(), cat_features.T)})
one_hot_data.head()

# %%
mark_features = pd.concat([num_features, one_hot_data], axis=1, sort=False)
mark_features.head()

# %%
feature_names = list(mark_features.columns.values)

# %%
clf_marks_tree = DecisionTreeClassifier(
    criterion='entropy',
    max_depth=3,
    random_state=17,
)

# %%
clf_marks_tree.fit(mark_features, marks_test)

# %%


def tree_graph_to_png(tree, feature_names, output_path, class_names=None):
    tree_str = export_graphviz(tree, feature_names=feature_names,
                               class_names=class_names,
                               filled=True, out_file=None)
    (graph,) = pydot.graph_from_dot_data(tree_str)
    graph
    graph.write_png(output_path)


# %%
out_dir = os.path.join(data_dir, 'out')
pathlib.Path(out_dir).mkdir(parents=True, exist_ok=True)
marks_image = os.path.join(out_dir, 'marks.png')

tree_graph_to_png(tree=clf_marks_tree,
                  feature_names=feature_names,
                  class_names=clf_marks_tree.classes_,
                  output_path=marks_image)

# %%
display_img(marks_image)
