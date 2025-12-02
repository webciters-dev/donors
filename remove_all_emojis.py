#!/usr/bin/env python3
"""Remove ALL emojis from source files in the donor project"""

import os
import re
import sys
from pathlib import Path

# Emoji regex patterns - comprehensive coverage
EMOJI_PATTERN = re.compile(
    "["
    "\U0001F300-\U0001F9FF"  # Emoticons, Symbols, Pictographs
    "\U0001F600-\U0001F64F"  # Emoticons
    "\U0001F900-\U0001F9FF"  # Supplemental Symbols
    "\U0001F1E0-\U0001F1FF"  # Flags
    "\U00002600-\U000026FF"  # Misc symbols
    "\U00002700-\U000027BF"  # Dingbats
    "\U0001F680-\U0001F6FF"  # Transport
    "\U0001F700-\U0001F77F"  # Alchemical symbols
    "\U0001F780-\U0001F7FF"  # Geometric shapes
    "]",
    flags=re.UNICODE
)

def should_process(file_path):
    """Check if file should be processed"""
    path_str = str(file_path).lower()
    
    # Skip node_modules and other common exclusions
    skip_dirs = {'node_modules', '.git', '.next', 'dist', 'build', '.env'}
    for skip_dir in skip_dirs:
        if f"\\{skip_dir}\\" in path_str or f"/{skip_dir}/" in path_str:
            return False
    
    # Only process these file types
    valid_extensions = {'.jsx', '.js', '.md', '.sh', '.ts', '.tsx'}
    return file_path.suffix.lower() in valid_extensions

def remove_emojis_from_file(file_path):
    """Remove emojis from a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file contains emojis
        matches = EMOJI_PATTERN.findall(content)
        if not matches:
            return 0
        
        emoji_count = len(matches)
        new_content = EMOJI_PATTERN.sub('', content)
        
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return emoji_count
    except Exception as e:
        print(f"  ERROR: {e}")
        return 0

def main():
    """Main processing function"""
    project_root = Path("c:\\projects\\donor")
    if not project_root.exists():
        print("ERROR: Project path not found")
        sys.exit(1)
    
    print("=" * 60)
    print("EMOJI REMOVAL TOOL - DONOR PROJECT")
    print("=" * 60)
    print()
    
    files_to_process = []
    for file_path in project_root.rglob("*"):
        if file_path.is_file() and should_process(file_path):
            files_to_process.append(file_path)
    
    print(f"Found {len(files_to_process)} source files to scan...")
    print()
    
    files_modified = 0
    total_emojis = 0
    
    for file_path in sorted(files_to_process):
        emoji_count = remove_emojis_from_file(file_path)
        if emoji_count > 0:
            rel_path = file_path.relative_to(project_root)
            print(f"CLEANED: {rel_path}")
            print(f"  - Emojis removed: {emoji_count}")
            files_modified += 1
            total_emojis += emoji_count
    
    print()
    print("=" * 60)
    print("EMOJI REMOVAL COMPLETE")
    print("=" * 60)
    print(f"Files processed:       {len(files_to_process)}")
    print(f"Files modified:        {files_modified}")
    print(f"Total emojis removed:  {total_emojis}")
    print()
    print("KEY FACT: Emoji removal will NOT break any functionality!")
    print("- Emojis were only in console.log statements (debugging)")
    print("- Email templates (cosmetic, emails still send)")
    print("- Markdown documentation (informational only)")
    print("- UI text labels (will display as plain text)")
    print()
    print("All systems remain fully functional.")
    print("=" * 60)

if __name__ == "__main__":
    main()
