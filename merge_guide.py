
import os

file_parts = [
    r'd:\Chitchat\temp_guide_part1.md',
    r'd:\Chitchat\temp_guide_part2.md',
    r'd:\Chitchat\temp_guide_part3.md',
    r'd:\Chitchat\temp_guide_part4.md'
]
output_file = r'd:\Chitchat\Guide.md'

try:
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for fname in file_parts:
            with open(fname, 'r', encoding='utf-8') as infile:
                outfile.write(infile.read())
            # Add a newline between parts just in case
            outfile.write('\n')
    print("Success: Guide.md restored and updated.")
except Exception as e:
    print(f"Error: {e}")
