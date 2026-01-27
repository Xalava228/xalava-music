# -*- coding: utf-8 -*-
import zipfile
import xml.etree.ElementTree as ET
import sys

try:
    z = zipfile.ZipFile('Cодержание.docx')
    xml_content = z.read('word/document.xml')
    root = ET.fromstring(xml_content)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    texts = []
    for t in root.findall('.//w:t', ns):
        if t.text:
            texts.append(t.text)
    
    with open('content_structure.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(texts))
    
    print("Extracted successfully")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
