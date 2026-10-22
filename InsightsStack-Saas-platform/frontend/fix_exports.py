import os, re
for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            match = re.search(r'(?:export\s+default\s+(?:const|function)|export\s+(?:const|function))\s+([A-Za-z0-9_]+)', content)
            if match:
                name = match.group(1)
                content = re.sub(r'export\s+default\s+(const|function)', r'\1', content)
                content = re.sub(r'export\s+(const|function)', r'\1', content)
                if 'export default ' + name not in content:
                    content += f'\nexport default {name};\n'
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
