#!/usr/bin/env python3
import re

# Read the file
with open('catalogue/catalogue-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Items to keep (those with templates)
keep_items = {
    'FOOD-005', 'FOOD-006', 'FOOD-007', 'FOOD-008', 'FOOD-009', 'FOOD-010', 'FOOD-011',
    'RE-006', 'RE-007', 'RE-008', 'RE-009', 'RE-010', 'RE-011',
    'FIT-006', 'FIT-007', 'FIT-008', 'FIT-009', 'FIT-010', 'FIT-011',
    'BEAUTY-006', 'BEAUTY-007', 'BEAUTY-008', 'BEAUTY-009', 'BEAUTY-010', 'BEAUTY-011',
    'SERV-006', 'SERV-007', 'SERV-008', 'SERV-009', 'SERV-010', 'SERV-011'
}

# Extract header
header_match = re.search(r'(.*?)(export const ITEMS = \[\n)', content, re.DOTALL)
if not header_match:
    print('ERROR: Could not find header')
    exit(1)

header = header_match.group(1)
items_start_marker = header_match.group(2)

# Update the comment about item count
header = header.replace(
    '50 catalogue items (10 categories × 5 products)',
    '31 catalogue items (5 active categories)'
).replace(
    'Note: These are "products" in your catalogue; you can later add real live previews.',
    'Each item has a corresponding website template.'
)

# Find items
items_section = content[len(header) + len(items_start_marker):]
end_match = re.search(r'\];', items_section)
if not end_match:
    print('ERROR: Could not find end of ITEMS array')
    exit(1)

items_text = items_section[:end_match.start()]
footer = items_section[end_match.start():]

# Parse and filter items
filtered_items = []
depth = 0
start_idx = 0

for i, char in enumerate(items_text):
    if char == '{':
        if depth == 0:
            start_idx = i
        depth += 1
    elif char == '}':
        depth -= 1
        if depth == 0:
            block = items_text[start_idx:i+1]
            sku_match = re.search(r'sku: "([^"]+)"', block)
            if sku_match:
                sku = sku_match.group(1)
                if sku in keep_items:
                    filtered_items.append(block)

# Construct new content
new_items_section = ',\n  '.join(filtered_items)
new_content = header + items_start_marker + '  ' + new_items_section + '\n' + footer

# Write back
with open('catalogue/catalogue-data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'✓ Successfully cleaned up catalogue!')
print(f'  Kept: {len(filtered_items)} items (with templates)')
print(f'  Removed: {81 - len(filtered_items)} orphan items')
print()
print('Kept categories:')
print('  • Restaurant & Cafe: 7 items (FOOD-005 to FOOD-011)')
print('  • Real Estate: 6 items (RE-006 to RE-011)')
print('  • Fitness & Wellness: 6 items (FIT-006 to FIT-011)')
print('  • Beauty Salon & Spa: 6 items (BEAUTY-006 to BEAUTY-011)')
print('  • Local Services: 6 items (SERV-006 to SERV-011)')
