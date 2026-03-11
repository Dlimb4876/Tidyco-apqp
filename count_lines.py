import os

root_dir = r"c:\Users\Tidyco\Documents\GitHub\Tidyco-apqp"
exclude_dirs = {".git", ".claude"}
include_extensions = {".html", ".css", ".js", ".md"}

results = []

for root, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if any(file.endswith(ext) for ext in include_extensions):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = sum(1 for _ in f)
                results.append((path, lines))
            except Exception as e:
                print(f"Error reading {path}: {e}")

# Group by directory
summary = {}
for path, lines in results:
    rel_path = os.path.relpath(path, root_dir)
    parts = rel_path.split(os.sep)
    category = parts[0] if len(parts) > 1 else "root"
    summary[category] = summary.get(category, 0) + lines

print("Detailed Line Counts:")
for path, lines in sorted(results, key=lambda x: x[1], reverse=True):
    print(f"{lines:6} | {os.path.relpath(path, root_dir)}")

print("\nSummary by Category:")
for category, total in sorted(summary.items(), key=lambda x: x[1], reverse=True):
    print(f"{total:6} | {category}")
