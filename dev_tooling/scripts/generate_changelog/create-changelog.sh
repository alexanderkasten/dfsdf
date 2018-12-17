#!/bin/bash

#####
# This script creates the changelog almost automatically.
#####

if [ $# -ne 2 ]; then
  echo "Usage: $0 <Github Username>:<Github Authtoken> <Previous_Version> <Current_Version>"

  exit 1
fi

echo " ️  Generating Changelog File..."
bash generate_release_markdown_file.sh $2 $3

echo " ️  Getting Merge Commits.."
bash get_merge_commits.sh $2 $3
bash format_messages.bash merge_commits_of_release.txt formatted_messages.txt

echo "🛀 Please clean up the Merge Commits!"
code formatted_messages.txt -w
bash sort_and_format_merge_commits.sh

echo "📋 Merge Commits have been copied to clipboard."
echo "✏️  Please paste the Merge Commits into the 'Full Changelog' section!"
code releasenotes_$3.md --wait

echo " ️ Getting Closed Issues.."
GITHUB_AUTH="$1" bash get_fixed_issues.sh
echo "🛀 Please clean up the Closed Issues!"
code closed_issues --wait
bash format_messages.bash closed_issues formatted_closed_issues.txt
echo "📋 Closed Issues have been copied to Clipboard."
cat formatted_closed_issues.txt | pbcopy
echo "✏️  Please paste the Closed Issues in the 'Fixed Issues' section!"
code releasenotes_$3.md --wait
echo "  Release Notes have been created!!!"
code releasenotes_$3.md --wait
echo "👋 Bye Bye!"
