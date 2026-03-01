import os
from pypdf import PdfReader

def read_pdf(filepath):
    print(f"--- Reading: {filepath} ---")
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print(text[:2000]) # Print first 2000 chars
        print(text[-2000:]) # Print last 2000 chars
        print(f"Total pages: {len(reader.pages)}, Total length: {len(text)}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

read_pdf('/Users/juanjosefuentes/Documents/gold/front-bethergold/src/assets/Entregables/Guia Rapida/Guia Rapida Bether Gold.pdf')
read_pdf('/Users/juanjosefuentes/Documents/gold/front-bethergold/src/assets/Entregables/Guia de identidad/Guia.pdf')
