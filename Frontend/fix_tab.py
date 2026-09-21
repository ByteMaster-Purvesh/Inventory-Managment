import re

file_path = r'c:\Users\Purushottam\Desktop\VVrapIT-Freelance\2. PreciTech Works\Version\version 1\Frontend\src\features\editor\components\PreviewPane.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace tabName="Home" with tabName="Form" for all fields
content = content.replace('tabName="Home"', 'tabName="Form"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed tabName to Form in PreviewPane.jsx')
